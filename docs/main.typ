#import "@preview/ilm:1.4.1": *
#import "@preview/codly:1.3.0": *
#import "@preview/codly-languages:0.1.1": *

#show: codly-init.with()

#codly(
  languages: (
    rust: (name: "Rust", icon: "🦀", color: rgb("#CE412B")),
    sh: (name: "Terminal", color: rgb("#000000"))
  ),
  number-format: none
)
#set text(lang: "en")

#show: ilm.with(
  title: [KIREPRO1PE \ \ Compression of Programs and the Similarity Distance],
  author: "Jonas Nim Røssum <jglr@itu.dk>",
  date: datetime(year: 2025, month: 05, day: 15),
  abstract: [
    #text(weight: "bold")[Supervisor:] Mircea Lungu \<mlun\@itu.dk\>

    TODO: ABSTRACT
  ],
  preface: [
    #align(center + horizon)[
      \[#sym.dots.h\]
      #text(style: "italic")[ 
        They took away the old timbers from time to time, and put new and sound ones in their places, so that the vessel became a standing illustration for the philosophers in the mooted question of growth, some declaring that it *remained the same, others that it was not the same vessel.* ]
      
      —  Plutarch, Life of Theseus 23.1
    ] 
  ],
  bibliography: bibliography("refs.bib"),
  figure-index: (enabled: true),
  table-index: (enabled: true),
  listing-index: (enabled: true),
)

= Compression of Programs and the Similarity Distance

== Lines of Code Changed

Lines of code (LoC) @Sourceli1:online is one of the most widely used sizing metrics in the software industry @nguyen2007sloc. Combining LoC with data from version control systems and diffing algorithms, we can track get the Lines of code _changed_, or LoCC over time. This is a commonly used technique used to detect activity in software systems over time @goeminne2013analyzing. It can be used to assess team velocity, developer productivity and more. These metrics can be automatically obtained via version control systems using tools like Git Truck@hojelse2022git. LoCC is a useful metric for quantifying contributions or regions of interest in software systems over time and tools like Git Truck have proven the effectiveness in the analysis of software evolution @lungu2022can, @neyem2025exploring. 

// === How to calculate line changes 
// Line changes are often computed using diffing algorithms. Many tools utilize git’s built in diff tool that uses file diffing to measure line changes. In practice, this can be done using the git command line interface:

// ```sh
// git log –numstat main 
// ```

// For example, running this on the latest commit in the Git Truck repository, as of writing#footnote("https://github.com/git-truck/git-truck/commit/02bdbbf97f4e647f97c7890fc24b2864d862b1f5"), produces the following output:


// ```
// git-truck $ git log --numstat main --no-walk --pretty="%h %s"
// +       -        file
// 1       1       .github/workflows/check-bun.yml
// 3       3       .github/workflows/playwright.yml
// 0       3       .vscode/settings.json
// 7       9       README.md
// 19      0       e2e/features/clear-analyzed-results.spec.ts
// 1       1       e2e/features/navigate-to-a-repository.spec.ts
// 220     988     package-lock.json
// 4       6       package.json
// 2       2       playwright.config.ts
// 2       1       remix.config.mjs
// 168     233     src/analyzer/DB.server.ts
// 0       91      src/analyzer/DBInserter.ts
// 1       1       src/analyzer/InstanceManager.server.ts
// 2       2       src/analyzer/ServerInstance.server.ts
// 0       30      src/analyzer/analyze.test.ts
// 80      0       src/analyzer/coauthors.server.test.ts
// 7       5       src/analyzer/coauthors.server.ts
// 3       2       src/analyzer/util.server.ts
// 8       15      src/components/AuthorOptions.tsx
// 5       3       src/components/Chart.tsx
// 2       2       src/components/accordion/Accordion.tsx
// 4       2       src/routes/progress.tsx
// ```

// , which calculates line changes in the files. This can easily be parsed and processed for the entire history of a project and visualized over time.


= Problem: Shortcomings of LoCC

There are multiple problems when relying on LoCC as a sole metric of productivity.

== First problem: Definition

Firstly, the term itself is ambiguous and subjective to the formatting of the code. See the following examples in @ambiguousListings. A few of the questions that comes to mind include whether the examples should be counted as three or one lines of code. A developer writing either of these should be judged as equally productive, yet the developer who wrote the first listing deemed three times more productive as the others.

#figure(
  caption: [Ambiguous line counts],
  grid(
    columns: (13fr, 21fr, 19fr),
    gutter: 10pt,
    rows: 60pt,
    ```
      if (condition) {
        doStuff();
      }
    ```,  
    ```
      if (condition) { doStuff(); }
      
      
    
    ```, 
    ```
      if (condition) doThis();
      
      
      
    ```
  ),
) <ambiguousListings>

== Second problem: Developer habits and automatic actions

Another case where LoC falls short is when performing actions that affects a vast amount of files and leads to spikes in line changes. Examples of this include running formatting scripts or installing packages, which often leads to a lot of line changes in tracked lock files [ref]. 

#figure[Figure showing file with high activity / many automated commits]

These kinds of changes does not directly reflect high activity or productivity, but they still result in high LoCC values. These reasons show why this metric cannot stand alone as a measure of productivity. Doing so may lead to misinterpretation of the results, portraying certain developers or areas of the system as more active than they actually are. 

== Third problem: Renames, a problem with relying on git diffing metadata alone

The LoCC metric can be distorted also by file renames, which may artificially inflate contribution counts, since renaming a file requires little effort but appears as significant line changes. Git supports rename detection using a similarity threshold#footnote[https://git-scm.com/docs/git-log#Documentation/git-log.txt-code-Mltngtcode], comparing deleted and added files to identify likely renames, utilized by tools such as Git Truck. While Git doesn’t exclude renames by default, this tracking can be used to filter them out manually. However, rename detection is inherently ambiguous — at what point should we stop treating a change as a rename and instead count it as having deleted the old file and added a new one?#footnote[https://en.wikipedia.org/wiki/Ship_of_Theseus]

The issue is further complicated when developers squash commits, potentially losing rename information. Ultimately, it’s a trade-off between overcounting trivial renames and missing substantial, legitimate contributions.

=

Using an alternative approach, by concatenating the entire state of the repository, makes the analysis resistant to renames, as we don't care about file names, we only care about the bytes contained in the commit. However, in this case, we can no longer rely on diffing the concatenated string. We need to use another approach to derive the information distance from before and after a commit.

Normalized Compression Distance (NCD) is a way of measuring the similarity between two compressible objects, using lossless compression algorithms such as GZIP and ZStandard. It is a way of approximating the Normalized Information Distance and has widespread uses such as cluster analysis [https://arxiv.org/abs/cs/0312044], and it has even been used to train sentiment analysis.

However, nobody has used normalized compression ratio as a distance metric in version controlled systems yet. The hypothesis of this work is that NCD-derived metrics could function as a complement to the more well-known LC and NoC metrics mentioned above, and be resilient to renaming.


= Metric
  - Correlation between CD delta and complexity
= Present method
= Present implementation

= Present experiments

== Compression Distance vs. manual subjective classification


== Compression Distance vs. semi automatic objective classification

== Compression Distance aggregated over authors

== Git Truck
If you look beyond our bachelors project, where we all four worked on the project, you see that Dawid joined as a contributor during his master thesis. Af ter that, Thomas did his master thesis on the project as well, which is very 

// =



// = Layout
// The template uses `A4` as its page size, you can specify a different #link("https://typst.app/docs/reference/layout/page#parameters-paper")[paper size string] using:

// ```typst
// #show: ilm.with(
//   paper-size: "us-letter",
// )
// ```

// 'Ilm display's its content in the following order:
// + Cover page
// + Preface page (if defined)
// + Table of contents (unless disabled)
// + Body (your main content)
// + Appendix (if defined)
// + Bibliography (if defined)
// + Indices (if enabled) --- index of figures (images), tables, or listings (code blocks)

// == Cover
// The cover/title page has a title, author, date, and abstract which is a short description shown under the author name:

// ```typst
// #show: ilm.with(
//   title: [Your Title],
//   author: "Author Name",
//   date: datetime(year: 2024, month: 03, day: 19),
//   abstract: [Your content goes here],
// )
// ```

// Only the `title` and `author` fields are necessary; `date` and `abstract` are optional.

// By default, the date is shown in the format: `MMMM DD, YYYY`. You can change the date format by specifying a different format string:

// ```typst
// #show: ilm.with(
//   date-format: "[month repr:long] [day padding:zero], [year repr:full]",
// )
// ```

// See Typst's #link("https://typst.app/docs/reference/foundations/datetime/#format")[official documentation] for more info on how date format strings are defined.

// == Preface
// The preface content is shown on its own separate page after the cover page.

// You can define it using:

// ```typst
// #show: ilm.with(
//   preface: [
//     = Preface Heading
//     Your content goes here.
//   ],
// )
// ```

// #emoji.fire Tip: if your preface is quite long then you can define it in a separate file and import it in the template definition like so:

// ```typst
// #show: ilm.with(
//   // Assuming your file is called `preface.typ` and is
//   // located in the same directory as your main Typst file.
//   preface: [#include "preface.typ"],
// )
// ```

// == Table of Contents
// By default, 'Ilm display a table of contents before the body (your main content). You can disable this behavior using:

// ```typst
// #show: ilm.with(
//   table-of-contents: none,
// )
// ```

// The `table-of-contents` option accepts the result of a call to the `outline()` function, so if you want to customize the behavior of table of contents then you can specify a custom `outline()` function:

// ```typst
// #show: ilm.with(
//   table-of-contents: outline(title: "custom title"),
// )
// ```

// See Typst's #link("https://typst.app/docs/reference/model/outline/")[official documentation] for more information.

// == Body
// By default, the template will insert a #link("https://typst.app/docs/reference/layout/pagebreak/")[pagebreak] before each chapter, i.e. first-level heading. You can disable this behavior using:

// ```typst
// #show: ilm.with(
//   chapter-pagebreak: false,
// )
// ```

// == Appendices
// The template can display different appendix, if you enable and define it:

// ```typst
// #show: ilm.with(
//   appendix: (
//     enabled: true,
//     title: "Appendix", // optional
//     heading-numbering-format: "A.1.1.", // optional
//     body: [
//       = First Appendix
//       = Second Appendix
//     ],
//   ),
// )
// ```

// The `title` and `heading-numbering-format` options can be omitted as they are optional and will default to predefined values.

// #emoji.fire Tip: if your appendix is quite long then you can define it in a separate file and import it in the template definition like so:

// ```typst
// #show: ilm.with(
//   appendix: (
//     enabled: true,
//     // Assuming your file is called `appendix.typ` and is
//     // located in the same directory as your main Typst file.
//     body: [#include "appendix.typ"],
//   ),
// )
// ```

// == Bibliography
// If your document contains references and you want to display a bibliography/reference listing at the end of the document but before the indices then you can do so by defining `bibliography` option:

// ```typst
// #show: ilm.with(
//   // Assuming your file is called `refs.bib` and is
//   // located in the same directory as your main Typst file.
//   bibliography: bibliography("refs.bib"),
// )
// ```

// The `bibliography` option accepts the result of a call to the `bibliography()` function, so if you want to customize the behavior of table of contents then you can do so by customizing the `bibliography()` function that you specify here. See Typst's #link("https://typst.app/docs/reference/model/bibliography/")[official documentation] for more information.

// == Indices
// The template also displays an index of figures (images), tables, and listings (code blocks) at the end of the document, if you enable them:

// ```typst
// #show: ilm.with(
//   figure-index: (
//     enabled: true,
//     title: "Index of Figures" // optional
//   ),
//   table-index: (
//     enabled: true,
//     title: "Index of Tables" // optional
//   ),
//   listing-index: (
//     enabled: true,
//     title: "Index of Listings" // optional
//   ),
// )
// ```

// The `title` option can be omitted as it is optional and will default to predefined values.

// == Footer
// If a page does not begin with a chapter then the chapter's name, to which the current section belongs to, is shown in the footer.

// Look at the page numbering for the current page down below. It will show "#upper[Layout]" next to the page number because the current subheading _Footer_ is part of the _Layout_ chapter.

// When we say chapter, we mean the the first-level or top-level heading which is defined using a single equals sign (`=`).

// = Text
// Typst defaults to English for the language of the text. If you are writing in a different language then you need to define you language before the 'Ilm template is loaded, i.e. before the `#show: ilm.with()` like so:

// ```typst
// #set text(lang: "de")
// #show: ilm.with(
//   // 'Ilm's options defined here.
// )
// ```

// By defining the language before the template is loaded, 'Ilm will set title for bibliography and table of contents as per your language settings as long as you haven't customized it already.

// == External links
// 'Ilm adds a small maroon circle to external (outgoing) links #link("https://github.com/talal/ilm")[like so].

// This acts as a hint for the reader so that they know that a specific text is a hyperlink. This is far better than #underline[underlining a hyperlink] or making it a #text(fill: blue)[different color]. Don't you agree?

// If you want to disable this behavior then you can do so by setting the concerning option to `false`:

// ```typst
// #show: ilm.with(
//   external-link-circle: false,
// )
// ```

// == Blockquotes
// 'Ilm also exports a `blockquote` function which can be used to create blockquotes. The function has one argument: `body` of the type content and can be used like so:

// ```typst
// #blockquote[
//   A wizard is never late, Frodo Baggins. Nor is he early. He arrives precisely when he means to.
//   --- Gandalf
// ]
// ```

// The above code will render the following:

// #blockquote[
//   A wizard is never late, Frodo Baggins. Nor is he early. He arrives precisely when he means to.
//   --- Gandalf
// ]

// == Small- and all caps
// 'Ilm also exports functions for styling text in small caps and uppercase, namely: `smallcaps` and `upper` respectively.

// These functions will overwrite the standard #link("https://typst.app/docs/reference/text/smallcaps/")[`smallcaps`] and #link("https://typst.app/docs/reference/text/upper/")[`upper`] functions that Typst itself provides. This behavior is intentional as the functions that 'Ilm exports fit in better with the rest of the template's styling.

// Here is how Typst's own #std-smallcaps[smallcaps] and #std-upper[upper] look compared to the 'Ilm ones:\
// #hide[Here is how Typst's own ] #smallcaps[smallcaps] and #upper[upper]

// They both look similar, the only difference being that 'Ilm uses more spacing between individual characters.

// If you prefer Typst's default spacing then you can still use it by prefixing `std-` to the functions:

// ```typst
// #std-smallcaps[your content here]
// #std-upper[your content here]
// ```

// == Tables
// In order to increase the focus on table content, we minimize the table's borders by using thin gray lines instead of thick black ones. Additionally, we use small caps for the header row. Take a look at the table below:

// #let unit(u) = math.display(math.upright(u))
// #let si-table = table(
//   columns: 3,
//   table.header[Quantity][Symbol][Unit],
//   [length], [$l$], [#unit("m")],
//   [mass], [$m$], [#unit("kg")],
//   [time], [$t$], [#unit("s")],
//   [electric current], [$I$], [#unit("A")],
//   [temperature], [$T$], [#unit("K")],
//   [amount of substance], [$n$], [#unit("mol")],
//   [luminous intensity], [$I_v$], [#unit("cd")],
// )

// #figure(caption: ['Ilm's styling], si-table)

// For comparison, this is how the same table would look with Typst's default styling:

// #[
//   #set table(inset: 5pt, stroke: 1pt + black)
//   #show table.cell.where(y: 0): it => {
//     v(0.5em)
//     h(0.5em) + it.body.text + h(0.5em)
//     v(0.5em)
//   }
//   #figure(caption: [Typst's default styling], si-table)
// ]

// = Code
// == Custom font
// 'Ilm uses the _Iosevka_@wikipedia_iosevka font for raw text instead of the default _Fira Mono_. If Iosevka is not installed then the template will fall back to Fira Mono.

// #let snip(cap) = figure(caption: cap)[
//   ```rust
//   fn main() {
//       let user = ("Adrian", 38);
//       println!("User {} is {} years old", user.0, user.1);

//       // tuples within tuples
//       let employee = (("Adrian", 38), "die Mobiliar");
//       println!("User {} is {} years old and works for {}", employee.0.1, employee.0.1, employee.1);
//   }
//   ```
// ]

// #show raw: set text(font: "Fira Mono")
// For comparison, here is what `code` in Fira Mono looks like:
// #snip("Code snippet typeset in Fira Mono font")

// #show raw: set text(font: ("Iosevka", "Fira Mono"))
// and here is how the same `code` looks in Iosevka:
// #snip("Code snippet typeset in Iosevka font")

// In the case that both code snippets look identical then it means that Iosevka is not installed on your computer.
