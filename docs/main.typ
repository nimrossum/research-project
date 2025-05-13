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
