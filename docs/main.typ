#import "@preview/ilm:1.4.1": *
#import "@preview/codly:1.3.0": *
#import "@preview/codly-languages:0.1.1": *

#show: codly-init.with()

#codly(
  languages: (
    rust: (name: "Rust", color: rgb("#CE412B")),
    sh: (name: "Terminal", color: rgb("#000000"))
  ),
  number-format: none,
  display-name: false
)
#set text(lang: "en")

#show: ilm.with(
  title: [KIREPRO1PE \ \ Compression of Programs and the Similarity Distance],
  author: "Jonas Nim Røssum <jglr@itu.dk>",
  date: datetime(year: 2025, month: 05, day: 15),
  abstract: [
    #text(weight: "bold")[Supervisor:] Mircea Lungu \<mlun\@itu.dk\>
  // TODO: ABSTRACT
  ],
  preface: [
    #align(center + horizon)[
      #box(
        width: 127mm,
        [
          _They took away the old timbers from time to time, and put new and sound ones in their places, so that the vessel became a standing illustration for the philosophers in the mooted question of growth, some declaring that it *remained the same, others that it was not the same vessel.*_
          \
          \
          —  Plutarch, Life of Theseus 23.1
        ]
      )
      \
      \
      \
      \
      \
      \
      \
      \
      \
      \
      \
      \
      \
      \
      #box(
        width: 94mm,
        [
I would like to thank Christian Gram Kalhauge \<chrg\@dtu.dk\> for proposing the idea for this project and for his valuable external supervision and guidance.])



    ]
  ],
  bibliography: bibliography("refs.bib"),
  figure-index: (enabled: true),
  table-index: (enabled: true),
  listing-index: (enabled: true),
)

= Introduction



RQ1 *Is the compression distance a more representative metric for quantifying the complexity than lines of code changed?*

RQ2 *Can the compression distance tell us about the complexity of different categories of commits?*

RQ3 *Does the compression distance suffer from the same limitations as lines of code changed in quantifying the contributions of developers?*

= Introduction to Similarity Distance Metrics

== Information distance

In the field of information theory, the concept of _information distance_ is used to quantify the similarity between two objects (TODO:REF). This is done by measuring the amount of information needed to transform one object into another. The most common way to measure this distance is by using a _distance metric_, which is a function that quantifies the difference between two objects.

While there exists no perfect such metric, we can approximate the information distance between two objects using various practical techniques.

== Lines of Code Changed as a measure of information distance

_Lines of code_ (LoC) @Sourceli1:online is one of the most widely used distance metrics in the software industry @nguyen2007sloc. It is often used as a measure of software complexity, maintainability, and productivity.


Since many projects employ version control systems, such as Git (TODO: Ref to Git), for keeping track of changes, we can we can track the _Lines of code changed_ (LoCC) over time using diffing algorithms. The LoCC metric is typically defined as the number of lines added and removed in a commit. (TODO: source?).
This provides a measure of the information distance between revisions of a software system. Git includes this functionality by default (TODO: Ref numstat).

This is a commonly used technique used to detect activity in software systems over time @goeminne2013analyzing. It can be used to assess team velocity, developer productivity and more. These metrics can be automatically obtained via version control systems using tools like Git Truck@hojelse2022git. LoCC is a useful metric for quantifying contributions or regions of interest in software systems over time and tools like Git Truck have proven the effectiveness in the analysis of software evolution @lungu2022can, @neyem2025exploring.

= Shortcomings of LoCC

There are multiple problems when relying on LoCC as a sole metric of productivity.

== First problem: Ambiguous LoCC definitions <loccDef>

Firstly, the term itself is ambiguous and subjective to the formatting of the code. One could say that line breaks are just an arbitrary formatting character. In reality, the program could have been written in a single line of code.

See the following ambiguous examples in @ambiguousListings. A few questions arise: should these snippets be counted as three separate lines of code or collapsed into a single line? In terms of actual work, a developer who writes either version is equally productive, yet if we simply count physical lines changed, the author of the first listing would be credited with three times the contribution of the second. This discrepancy shows how formatting alone can skew LoCC-based distance measures, as trivial style differences inflate the perceived distance between revisions and undermine the metric’s reliability.

#include("assets/ambiguous-line-counts.typ")

// TODO: add source of how different tools have ambiguous definitions of lines


== Second problem: Rename-detection pitfalls <renamePitfalls>

The LoCC metric can be distorted also by file renames, which may artificially inflate contribution counts, since renaming a file requires little effort but appears as significant line changes. Git supports rename detection using a similarity threshold#footnote[https://git-scm.com/docs/git-log#Documentation/git-log.txt-code-Mltngtcode], comparing deleted and added files to identify likely renames, utilized by tools such as Git Truck. While Git doesn’t exclude renames by default, this tracking can be used to filter them out manually. However, rename detection is inherently ambiguous — at what point should we stop treating a change as a rename and instead count it as having deleted the old file and added a new one?#footnote[https://en.wikipedia.org/wiki/Ship_of_Theseus]

The issue is further exacerbated when developers squash commits, potentially losing rename information. Ultimately, it’s a trade-off between overcounting trivial renames and missing substantial, legitimate contributions.

== Third problem: Automation-driven LoCC spikes <automationDrivenSpikes>

Another case where the LoCC metric falls short is when performing automated actions that affects a vast amount of files and leads to spikes in line changes. Examples of this include running formatting scripts or installing packages, which often leads to a lot of line changes in tracked lock files [ref].

// TODO
#figure[Figure of git truck showing file with high activity / many automated commits]

These kinds of changes do not directly reflect genuine development effort, but they still result in high LoCC values from which one often draw this conclusion. This shows why this metric cannot stand alone as a measure of productivity. This may cause the results to be misinterpreted, overstating the activity levels of certain developers or areas of the system.

== Fourth problem: Time bias <timeBias>


Tools like Git Truck track the LoCC through the entire history of a project by default, weighing ancient changes as much as recent changes. In the development of Git Truck, this was attempted to be mitigated by looking at blame information#footnote[https://github.com/git-truck/git-truck/commit/12582272b5854d6bf23706b292f3519750023fdd] instead and only considering how the files that are still present in the system as of today has changed through time. However, this technique is still prone to the errors introduced by the problem stated in @renamePitfalls. Another attempt to solve this was the introduction of the time range slider#footnote[https://github.com/git-truck/git-truck/pull/731], which led the user select a duration of time to analyze and "forget the past".

= Mitigating the problems of LoCC using Compression Distance instead
// This chapter is very rough

To mitigate the ambiguity described in @loccDef, we can instead consider the number of bytes instead of lines of code.

However, this means we can no longer rely on line-based diffing algorithms, akin to those used in TODO:GIT_DIFF_REF and must use an alternative method to measure the distance between revisions.

We can mitigate the problem with renames by concatenate all the files existing in each commit, measuring its size of the project before and after the commit to calculate a *byte distance metric*.

However, we are not homefree yet. We need to attempt to address the problem with automatic actions overstating impact.

This is where the Compression Distance comes in.

== Compression Distance

Instead of measuring the static difference in bytes before and after the commit, we can instead measure how well the changes we added compress with the previous version of the repository using a lossless compression algorithm. This way, in theory, large, repetitive actions would have a lower impact in the productivity score.

This is defined as the Compression Distance: the raw difference in compressed sizes.

Unlike the normalized compression distance, this metric is not bounded and is dependent on the absolute sizes of the compressed files. This is fine in this scenario, as we want to compare commits in the same project and the magnitude of the compression distance tells us an interesting story about the impact of the commit.

Then, we can compute the change in the size in bytes before and after the commit.

// Describe the method, how we compare the distance to the final version

If we attempt to compress the revisions in presence of the final revision of the repository, we get the side effect of introducing survivorship bias into the system. By measuring the compressed distance to the final revision of the project, we value changes that are more akin to the final version higher, in order  to tell a story about how we got to the final version and which commits were the most influential in getting there. This might not be what you want, but for some purposes this makes a lot of sense, as long as you keep the survivorship bias in mind. For example, a detour in the project that didn't make it in the final version is weighted by a negative distance // TODO: Show a commit from twooter (yoink) that has a negative distance
, telling us this brought the project further away from the final version, but it might still have been a valuable journey to take. Making "mistakes" is what move projects forward, since you might realize what _not_ to do, in order to find out what _to do_. // might remove the last bit here

// Figure showing spectrum of CD delta
// negative                                  0                              positive
// <------------------------------------------------------------------------------->
// far from the final version                of little impact               closer to the final version

=== Mitigating survivorship bias in compression distance

If we intend to value these types of detours better, we can use the magnitude of the distance instead, which then gives us the impact of the commit, no matter if it moved the project closer or further from the project

// Candlestick diagram  showing ups and downs






To mitigate these problems, we can use an alternative approach where we concatenate the entire state of the repository, makes the analysis resistant to renames, as we don't care about file names, we only care about the bytes contained in the commit. However, in this case, we can no longer rely on diffing the concatenated string. We need to use another approach to derive the information distance from before and after a commit.

Normalized Compression Distance (NCD) is a way of measuring the similarity between two compressible objects, using lossless compression algorithms such as GZIP and ZStandard. It is a way of approximating the Normalized Information Distance and has widespread uses such as cluster analysis [https://arxiv.org/abs/cs/0312044], and it has even been used to train sentiment analysis.

However, nobody has used normalized compression ratio as a distance metric in version controlled systems yet. The hypothesis of this work is that NCD-derived metrics could function as a complement to the more well-known LC and NoC metrics mentioned above, and be resilient to renaming.






= Present method

Q:  Why did we choose z standard? @cebrian2005common recommends
A: zstd has a large search window https://en.wikipedia.org/wiki/Zstd

According to @cebrian2005common, NCD is a very good distance measurement, when used in the proper
way.

= Present implementation

= Present experiments

time intervals that are meaningful:
git truck before hand in, multiple intervals
multiple projects




== Compression Distance vs. manual subjective classification

To answer RQ1

  - Correlation between CD delta and complexity

== Compression Distance vs. semi automatic objective classification

To answer RQ2

== Compression Distance aggregated over authors

To answer RQ3

http://localhost:3000/get-commits/?repo=git-truck&branch=645333e46ceea6abd5ee1d4a0cb2c605bd959725&count=Infinity
http://localhost:3000/get-commits/?repo=git-truck&count=Infinity

=== Observations

"Reasons for skews:
 - Code that was deleted again and no longer present in final version"
Intentional survivorship bias

== Limitations of compression distance

1. it's much slower to compute than \<- is it though???

2. limited window size @cebrian2005common leading to distorted distance measurements, especially in worst case when comparing identical objects exceeding these size constraints. This means that we are back to just measuring something similar to the byte distance

== Git Truck

If you look beyond our bachelors project, where we all four worked on the project, you see that Dawid joined as a contributor during his master thesis. Af ter that, Thomas did his master thesis on the project as well, which is very
