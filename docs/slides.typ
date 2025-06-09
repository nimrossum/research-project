#import "@preview/slydst:0.1.4": *

#let red(content) = text(fill: rgb(250, 0, 0), content)
#let yellow(content) = text(fill: rgb(200, 100, 0), content)
#let green(content) = text(fill: rgb(50, 170, 50), content)

#let dcd = $#sym.Delta"CD"$

#let defs = [
  #line()
  / Def. Compression Distance: $"CD"(a, b) = |C(a #sym.union b)| - |C(a)|$
  / Def. Difference in Compression Distance: #dcd $(x_n) = "CD"(x_(n-1)) - "CD"(x_n)$
  #line()
]

// #title-slide[
//   #text(2em, default-color)[*Slydst: Slides in Typst*]
// ]

#show: slides.with(
  title: "Compression of Programs and the Similarity Distance",
  subtitle: [
    KIREPRO1PE Research Project, MSc. Computer Science, ITU
  ],
  date: "10th of June 2025",
  authors: "Jonas Nim Røssum <jglr@itu.dk>",
  layout: "medium",

  ratio: 16 / 9,
  title-color: none,
)

// Today I'm presenting my research project, called Compression of Programs and the Similarity Distance.


== Background

- _Lines of Code Changed_ (LoCC)
  - De facto standard for measuring code changes
  - Has it's limitations (e.g. renaming files)


#figure(caption: "LoCC in a GitHub Pull Request", image("assets/LoCC in GitHub.png"))


#v(1fr)



== Project goal and findings

- Find a new metric to address limitations of _Lines of Code Changed_ (LoCC)
- _Difference in Compression Distance_ (#dcd)

#v(1fr)

#grid(
  columns: (1fr, 1.2fr),
  [
    *Research questions*
    #list(
      marker: sym.quest,
      [Is #dcd correlated with LoCC?],

      [Can #dcd discriminate \ between commit types?],
      [What are the advantages / \ limitations of #dcd?],
    )
  ],
  [
    *Findings*
    #list(
      marker: sym.arrow,
      [Partial linear correlation, $R^2={0.8, 0.7}$], // We theoretically expected an imperfect correlation
      [For Commitizen#footnote("https://github.com/commitizen-tools/commitizen/") repo, #green[features] and #red[bug fixes] \ stand apart], // We expected this, since #dcd captures semantic change
      [Robust to renames, survivorship bias / \ 250$#sym.times$ slower than LoCC, scaling challenges], // We expected this, since #dcd is based on compression and manually handling file buffers
    )
  ],
)
#v(1fr)

== RQ1: #dcd correlation with LoCC

// If we assume that the width of a code line is roughly constant, then the number of lines changed should correlate with the amount of bytes changed, which is the foundation of #dcd. Therefore, if #dcd is a different metric than LoCC, we expect it to correlate with LoCC, but not perfectly.

#grid(
  rows: (auto, 1fr, auto),
  [Linear regression $R^2$ for *commitizen*: 0.7],
  figure(
    image(
      height: 1fr,
      width: auto,
      "assets/LoCC vs ∆CD for commitizen-tools_commitizen (github).svg",
    ),
  ),

  [✅ #dcd and LoCC correlate, but not perfectly $#sym.arrow$ #dcd captures more than raw line changes]
)
#v(1fr)

// Forklar hvorfor det er fedt at der er lav correlation

// Intuitivt - hvorfor vil vi have en mid correlation

// Not sure why a power regression performs better for Commitizen

// 1
== RQ2: Commit Type Discrimination

#figure(
    caption: [
      Commits in the Commitizen repository categorized using conventional keywords#footnote("https://www.conventionalcommits.org/en/v1.0.0/")
    ],
  image(
    height: 17.0em,
    "assets/commitizenCD∆ vs LoCC.svg",
  ),
)

// 2
== RQ2: Commit Type Discrimination
#grid(
  columns: (2fr, 1.5fr),
  rows: (auto, auto, auto),
  gutter: 1em,
  grid.cell(
    colspan: 2,
    figure(
      image(
        height: 17.0em,
        "assets/Commitizen CD∆ vs LoCC_fix_feat.svg",
      ),
    ),
  ),
  // [
  //   #text(fill: color.rgb(250, 0, 00), weight: "bold", "Bug Fixes"): lower #dcd, more repetitive
  // ],
  // [
  //   #text(fill: color.rgb(50, 170, 50), weight: "bold", "Features"): higher #dcd, typically novel code
  // ],

  // grid.cell(
  //   colspan: 2,
  //   [✅ #dcd can partly discriminate between some commit types],
  // )
)

// 3
== RQ2: Commit Type Discrimination
#grid(
  columns: (2fr, 1.5fr),
  rows: (auto, auto, auto),
  gutter: 1em,
  grid.cell(
    colspan: 2,
    figure(
      image(
        height: 17.0em,
        "assets/Commitizen CD∆ vs LoCC_fix_feat.svg",
      ),
    ),
  ),
  [
    #text(fill: color.rgb(250, 0, 00), weight: "bold", "Bug Fixes"): lower #dcd, changes to existing code
  ],
  [
    #text(fill: color.rgb(50, 170, 50), weight: "bold", "Features"): higher #dcd, typically novel code
  ],

  // grid.cell(
  //   colspan: 2,
  //   [✅ #dcd can partly discriminate between some commit types],
  // )
)

// 4
== RQ2: Commit Type Discrimination
#grid(
  columns: (2fr, 1.5fr),
  rows: (auto, auto, auto),
  gutter: 1em,
  grid.cell(
    colspan: 2,
    figure(
      image(
        height: 17.0em,
        "assets/Commitizen CD∆ vs LoCC_fix_feat.svg",
      ),
    ),
  ),
  [
    #text(fill: color.rgb(250, 0, 00), weight: "bold", "Bug Fixes"): lower #dcd, changes to existing code
  ],
  [
    #text(fill: color.rgb(50, 170, 50), weight: "bold", "Features"): higher #dcd, typically novel code
  ],

  grid.cell(
    colspan: 2,
    [✅ #dcd can partly discriminate between some commit types, at least for this project],
  )
)

== RQ3: Advantages - Robust to Renames

// To explain how the metric is robust to renames, let's look at how to compute the metric for a Git Repository:

#figure(
  caption: "ΔCD (Difference in Compression Distance) Explained",
  image("assets/ΔCD explanation.png", height: 6.5cm)
)

#v(1fr)

✅ #dcd is insensitive to renames and project structure


== RQ3: Advantages - Survivorship Bias

// You need to be aware of what question you are asking.
// If you want to ask how much is each person responsible of the way the codebase looks today, you can use #dcd-
// If you want to know how much have they contributed throughout the project (including detours that got deleted in the end), you can use LoCC.

// This shows us that when evaluating work, it is neither sufficient to look at the final state alone, nor the entire history.

- Example: *Thomas’ thesis work in Git Truck*
- According to LoCC (left), Thomas is responsible for ~25% of the contributions project
- According to #dcd (right), Thomas is responsible for ~46% of the final revision

#columns(
  2,
  [#figure(
      image(
        height: 5.9cm,
        "assets/LoCC stack100.svg",
      ),
    )
    #figure(
      image(
        height: 5.9cm,
        "assets/CDD stack100.svg",
      ),
    )],
)


#v(1fr)

✅ #dcd reflects *lasting impact* on the codebase using survivorship bias

== Limitations: Performance and Scalability

#figure(
  image(
    height: 6.6cm,
    "assets/LoCC vs ∆CD for commitizen-tools_commitizen (github, 1977 commits).svg",
  ),
)


// === LoCC vs. #dcd

// The proposed metric, #dcd, attempts to address these issues.

// #let no = red[No]
// #let partially = yellow[Partially]
// #let yes = green[Yes]

// #table(
//   columns: (7cm, auto, auto),
//   inset: 7pt,
//   table.header(
//     [*Property*],
//     [*LoCC*],
//     [*#dcd*],
//   ),

//   [Fast computation using VCS data], yes, no,
//   [Easy to understand], yes, partially,
//   [Handles file renames], partially, yes,
//   // [Handles formatting changes], no, partially,
//   // [Handles automated actions], no, partially,
//   [Survivorship bias], no, yes,
// )

// #set text(weight: "regular")

== Future work
\
#set align(center + horizon)

#set rect(
  inset: 8pt,
  fill: rgb("e4e5ea"),
  height: 100%,
  width: 100%,
)

#grid(
  rows: (3cm, 3cm),
  columns: (7cm, 7cm),
  gutter: 1em,
  // Improve and thoroughly test *performance* and *scalability*
  rect(fill: silver, [Performance and scalability]),

  // Several of these experiments were only done on a single project
  rect(fill: silver, [Generalize findings]),

  // Visualize in *analysis tools* (e.g., in Git Truck)
  rect(fill: silver, [Integration]),

  // Explore more use cases for the metric
  // Blame has survivorship bias, but is prone to the renaming problem
  // Blame: Medium slow, no rename handling possible AT ALL, EXTREME survivorship bias
  rect(fill: silver, [Use cases]),
)

#set align(left + top)


// == Conclusion

// #dcd

// #set list(marker: sym.dots)
// - partly correlates with LoCC
// // by capturing semantic change, not just line edits
// - can *partly discriminate* between commit types
// //  (e.g., features vs. bug fixes), when combined with LoCC
// - reflects *lasting impact*
// //  through survivorship bias
// - has *limitations* and *bias*
// // such as *performance*, *scalability*, and *introduces bias*
// - can be improved in future work
// // : performance, scalability, integrate with tools

== Thank You - Questions?
\
#set align(center + horizon)
#image("assets/Ship_of_Theseus.svg", width: 4cm)

#set align(center + horizon)

#v(1fr)
Project work: Jonas Nim Røssum <#link("mailto:jglr\@itu.dk", "jglr@itu.dk")>

Original idea: Christian Gram Kalhauge \<chrg\@dtu.dk\>

Source code: #link("https://github.com/git-truck/git-truck/blob/961066cbc0b31adde0978d470f1301d38cadb4d1/src/routes/get-commits.tsx", "github.com/git-truck/git-truck")
