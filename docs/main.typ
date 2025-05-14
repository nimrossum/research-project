#import "@preview/ilm:1.4.1": *
#import "@preview/codly:1.3.0": *
#import "@preview/codly-languages:0.1.1": *

#show: codly-init.with()

#codly(
  languages: (
    rust: (name: "Rust", color: rgb("#CE412B")),
    sh: (name: "Terminal", color: rgb("#000000")),
  ),
  number-format: none,
  display-name: false,
)
#set text(lang: "en")

#show: ilm.with(
  title: [KIREPRO1PE \ \ Compression of Programs and the Similarity Distance],
  author: "Jonas Nim Røssum <jglr@itu.dk>",
  date: datetime(year: 2025, month: 05, day: 15),
  abstract: [
    #text(weight: "bold")[Supervisor:] Mircea Lungu \<mlun\@itu.dk\>
    *TODO: ABSTRACT*
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
        ],
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
          I would like to thank Christian Gram Kalhauge \<chrg\@dtu.dk\> for proposing the idea for this project and for his valuable external supervision and guidance.],
      )



    ]
  ],
  bibliography: bibliography("refs.bib"),
  figure-index: (enabled: true),
  table-index: (enabled: true),
  listing-index: (enabled: true),
)

= Introduction

Software engineering has consistently explored metrics to measure and compare the complexity and evolution of software systems. Number of issues closed, number of pull requests merged, lines of code changed. Among these, Lines of Code Changed (LoCC) has become a commonly used measure, providing insights into developer productivity and team velocity. However, as this paper will show, LoCC has limitations that needs to be considered when interpreting its results. In this paper, we will explore the shortcomings of LoCC and propose an alternative metric: Compression Distance (CD), derived from lossless compression algorithms with large search windows. By measuring the compressibility of changes between software revisions, CD offers a novel perspective on software evolution, addressing many of the shortcomings inherent in LoCC.

This work proposes an alternative approach: Compression Distance (CD), a metric derived from lossless compression algorithms such as ZStandard (zstd) with large search windows. By measuring the compressibility of changes between software revisions, CD offers a novel perspective on software evolution, addressing many of the shortcomings inherent in LoCC. This paper explores the theoretical underpinnings of CD, its practical implementation, and its potential to complement or even replace traditional metrics in certain contexts.

Through a series of experiments, we evaluate the effectiveness of CD in quantifying code complexity, distinguishing between commit types, and mitigating biases present in LoCC.

// TODO What does the results show?
// The results suggest that CD provides a more nuanced and robust measure of software evolution, paving the way for its adoption in both academic research and industry practice.

// TODO: Introduce compression distance, zstd, talk about search window size of zstd

RQ1 *Is the compression distance using zstd a more representative metric for quantifying the complexity of a version controlled software repository than lines of code changed?*

RQ2 *To what extent does compression distance using zstd discriminate between manual or semi-automatic commit types (e.g. such as bugfix, feature, refactoring, documentation and style)?*

RQ3 *Does the compression distance using zstd suffer from the same limitations as lines of code changed in quantifying the contributions of developers?*

=  Information distance and Similarity Distance Metrics in Software Engineering

In the field of information theory, the concept of _information distance_ is used to quantify the similarity between two objects (TODO:REF). This is done by measuring the amount of information needed to transform one object into another. The most common way to measure this distance is by using a _distance metric_, which is a function that quantifies the difference between two objects.

While there exists no perfect such metric, we can approximate the information distance between two objects using various practical techniques.

= Lines of Code Changed as a measure of information distance

_Lines of code_ (LoC) @Sourceli1:online is one of the most widely used distance metrics in the software industry @nguyen2007sloc. It is often used as a measure of software complexity, maintainability, and productivity.


Since many projects employ version control systems, such as Git (TODO: Ref to Git), for keeping track of changes, we can track the _Lines of code changed_ (LoCC) over time using diffing algorithms. The LoCC metric is typically defined as the number of lines added and removed in a commit. (TODO: source?).
This provides a measure of the information distance between revisions of a software system. Git includes this functionality by default (TODO: Ref numstat).

This is a commonly used technique used to detect activity in software systems over time @goeminne2013analyzing. It can be used to assess team velocity, developer productivity and more. These metrics can be automatically obtained via version control systems using tools like Git Truck@hojelse2022git. LoCC is a useful metric for quantifying contributions or regions of interest in software systems over time and tools like Git Truck have shown the effectiveness in the analysis of software evolution @lungu2022can, @neyem2025exploring.

= Shortcomings of LoCC

There are multiple problems when relying on LoCC as a sole metric of productivity.

== First problem: Ambiguous LoCC definitions <loccDef>

Firstly, the term itself is ambiguous and subjective to the formatting of the code. One could say that line breaks are just an arbitrary formatting character. In reality, the program could have been written in a single line of code.

See the following ambiguous examples in @ambiguousListings. A few questions arise: should these snippets be counted as three separate lines of code or collapsed into a single line? In terms of actual work, a developer who writes either version is equally productive, yet if we simply count physical lines changed, the author of the first listing would be credited with three times the contribution of the second. This discrepancy shows how formatting alone can skew LoCC-based distance measures, as trivial style differences inflate the perceived distance between revisions and undermine the metric’s reliability.

#include "assets/ambiguous-line-counts.typ"

// TODO: add source of how different tools have ambiguous definitions of lines


== Second problem: Rename-detection pitfalls <renamePitfalls>

The LoCC metric can be distorted also by file renames, which may artificially inflate contribution counts, since renaming a file requires little effort but appears as significant line changes. Git supports rename detection using a similarity threshold#footnote[https://git-scm.com/docs/git-log#Documentation/git-log.txt-code-Mltngtcode], comparing deleted and added files to identify likely renames, utilized by tools such as Git Truck. While Git doesn’t exclude renames by default, this tracking can be used to filter them out manually. However, rename detection is inherently ambiguous — at what point should we stop treating a change as a rename and instead count it as having deleted the old file and added a new one?#footnote[https://en.wikipedia.org/wiki/Ship_of_Theseus]

The issue is further exacerbated when developers squash commits, potentially losing rename information. Ultimately, it’s a trade-off between overcounting trivial renames and missing substantial, legitimate contributions.

== Third problem: Automation-driven LoCC spikes <automationDrivenSpikes>

Another case where the LoCC metric falls short is when performing automated actions that affects a vast amount of files and leads to spikes in line changes. Examples of this include running formatting and linting scripts or automated lock file updates when installing packages, all of which can lead to astronomical amounts of line changes.

// TODO
#figure[Figure of git truck showing file with high activity / many automated commits]

These kinds of changes do not directly reflect genuine development effort, but they still result in high LoCC values from which one often draw this conclusion. This shows why this metric cannot stand alone as a measure of productivity. This may cause the results to be misinterpreted, overstating the activity levels of certain developers or areas of the system.

== Fourth problem: Time bias <timeBias>


Tools like Git Truck track the LoCC through the entire history of a project by default, weighing ancient changes as much as recent changes. In the development of Git Truck, this was attempted to be mitigated by looking at blame information#footnote[https://github.com/git-truck/git-truck/commit/12582272b5854d6bf23706b292f3519750023fdd] instead and only considering how the files that are still present in the system as of today has changed through time. However, this technique is still prone to the errors introduced by the problem stated in @renamePitfalls. Another attempt to solve this was the introduction of the time range slider#footnote[https://github.com/git-truck/git-truck/pull/731], which led the user select a duration of time to analyze and "forget the past".

= Compression Distance and Mitigating the problems of LoCC

To mitigate the explored problems with LoCC, we can use a different approach to measure the distance between revisions of a software system. Instead of relying on the number of lines changed, we can use a metric derived from lossless compression algorithms, to measure the distance between revisions.

== Mitigating the problem of ambiguous definitions of LoCC and rename-detection pitfalls

To mitigate the ambiguity described in @loccDef, we can instead consider the change in the number of bytes instead of LoCC as a quantifier of developer activity.

However, this means we can no longer rely on line-based diffing algorithms, akin to those used in TODO:GIT_DIFF_REF and must use an alternative method to measure the distance between revisions.

We can mitigate the problem with ambiguity and renames by concatenating all the files existing in each commit. We will refer to this as the concatenated commit buffer, $"CCB"$. We can measure its size before and after the commit to calculate a *byte distance metric*, see @byte-distance-metric.

$#sym.Delta|R| = |x| - |x-1|$ <byte-distance-metric>

where $#sym.Delta|R|$ is the distance in bytes, $|x|$ is the size of the given commit buffer and $x-1$ is the size of the previous commit buffer.

This method does not address the problem with automatic actions overstating developer impact.

This leads us to the Compression Distance.

== Mitigating the problem of automation-driven LoCC spikes

Instead of measuring the static distance in bytes before and after the commit, we can instead try to measure the compression of the changes we added. Using a lossless compression algorithm, we compress the concatenation of the given commit buffer $x$ with the newest revision of the project $y$ and compare this value with the one for the previous commit $x-1$. The hypothesis being that this would make it such that large repetitive actions would have a lower impact, since they would compress better than smaller, but more complex changes. This assumes that the changes added in a commit will compress better in the presence of similar code. This requires the compression algorithm to have search window larger than double the size of the project files we intend to analyze, as explored in @cebrian2005common.


== Choice of compression algorithm

For compression the commit buffers,
Q: Why did we choose z standard? @cebrian2005common recommends PPMZ
A: zstd has a large search window https://en.wikipedia.org/wiki/Zstd

=== ZStandard compression algorithm

The ZStandard compression algorithm (zstd) @facebook31:online, has a window log of 21 @zstdlibc51:online for its default 3 level compression, making the window size $2^21 = 2"MB"$. This makes the it suitable for this task, as long as you are aware of the limit and remember to adjust it as needed.

== Definition of Compression Distance

We define the Compression Distance $"CD"$ metric as a measure of how much a given concatenated commit buffer compresses with the baseline commit buffer:

$
  "CD"(x, y) = |Z(x)| - |Z(x #sym.union y)|
$ <def:compression_distance>

where $"CD"$ is the compression distance, $x$ is the given concatenated commit buffer and $"Z"$ is a lossless compression algorithm.

Now we can define the impact of the commit $#sym.Delta"CD"$, compared to the previous commit buffer, giving us

$
  #sym.Delta "CD" = "CD"(x) - "CD"(x-1)
$ <def:compression_distance_delta>

Unlike the normalized compression distance, this metric is not bounded and is dependent on the absolute sizes of the compressed files. This is fine in this scenario, as we want to compare commits in the same project and the magnitude of the compression distance tells us an interesting story about the impact of the commit.

Then, we can compute the change in the size in bytes before and after the commit.

// Describe the method, how we compare the distance to the newest version

If we attempt to compress the commit buffers in presence of the newest commit buffer of the repository, we get the side effect of introducing survivorship bias into the system. By measuring the compressed distance to the newest commit buffer of the project, we value changes that are more akin to the newest version higher, in order to tell a story about how we got to the newest version and which commits were the most influential in getting there. This might not be what you want, but for some purposes this makes a lot of sense, as long as you keep the survivorship bias in mind. For example, a detour in the project that didn't make it in the newest version is weighted by a negative distance

*TODO: Show a commit from twooter (yoink) that has a negative distance*

, telling us this brought the project further away from the newest version, but it might still have been a valuable journey to take. Making "mistakes" is what move projects forward, since you might realize what _not_ to do, in order to find out what _to do_. // might remove the last bit here

// Figure showing spectrum of CD delta
// negative                                  0                              positive
// <------------------------------------------------------------------------------->
// far from the newest version                of little impact               closer to the newest version

=== Mitigating survivorship bias in compression distance

If we intend to value these types of detours better, we can use the magnitude of the distance instead, which then gives us the impact of the commit, no matter if it moved the project closer or further from the project

// Candlestick diagram  showing ups and downs






To mitigate these problems, we can use an alternative approach where we concatenate the entire state of the repository, makes the analysis resistant to renames, as we don't care about file names, we only care about the bytes contained in the commit. However, in this case, we can no longer rely on diffing the concatenated string. We need to use another approach to derive the information distance from before and after a commit.

Normalized Compression Distance (NCD) is a way of measuring the similarity between two compressible objects, using lossless compression algorithms such as GZIP and ZStandard. It is a way of approximating the Normalized Information Distance and has widespread uses such as cluster analysis [https://arxiv.org/abs/cs/0312044], and it has even been used to train sentiment analysis.

However, nobody has used normalized compression ratio as a distance metric in version controlled systems yet. The hypothesis of this work is that NCD-derived metrics could function as a complement to the more well-known LC and NoC metrics mentioned above, and be resilient to renaming.



= Methodology

During this project, we implemented several analysis tools exposed as an API endpoints in the Git Truck project. This was due to the foundation for performing analysis of commits were available in this project, to speed up the development of the tool.

We used these endpoints to collect and visualize data about different repositories to draw conclusions about the Compression Distance metric.

*TODO: If also talking about NCD, write about it here*

== Included file extensions

We chose to include/exclude certain file extensions, to focus the results on code files.

In general, file extensions commonly associated with code were included, while binary files like images, videos, and audio files as well as miscellaneous files were excluded.

If any extensions were found that were neither included nor excluded, an automatic warning was reported in the console, in order to consider whether it should be included or excluded.

We used the default compression level of 3, which has a window size of $2^(21) B = 2 "MB"$.
We checked that the repositories we used were smaller than half of this size#footnote("Due to compressing the newest commit buffer with each commit, meaning we need at least 2x the baseline buffer, assuming that no commit buffer is larger than the final buffer, but there is still some wiggle room for all of the projects, as none of them surpass 1 MB"), in order for the compression algorithm to consider the entire commit buffer when attempting to compress it.



= Implementation: Get Commits endpoint

The tool is able to go through a specified range of the history of a git repository $"repo=folder"$ going backwards $"count"=N|"Infinity"$ commits from the specified baseline commit or branch $"branch"=$ and compute metrics for each commit. The tool is, among other things, able to compute the Compression Distance in relation to the baseline commit, the newest commit in the repository.

To generate the data for this project, the following queries were used:

http://localhost:3000/get-commits/?repo=git-truck&branch=e2ba0de&count=Infinity

http://localhost:3000/get-commits/?repo=commitizen&branch=e177141&count=Infinity

http://localhost:3000/get-commits/?repo=twooter&branch=2a6a407&count=Infinity

The repo parameter refers to a specific git repository folder located relative to where the tools was downloaded.

Passing Infinity as count makes the tool go through all the commits in the repository.

The tool works by concatenating the entire state of the repository and using lossless compression algorithms to measure the distance between commits. From the compression distance, we can derive the $#sym.Delta "CD"$.


== NCD

According to @cebrian2005common, NCD is a very good distance measurement, when used in the proper
way.

= Present experiments


== Test cases

// buffer size $|S|/(2^10)^2$ (MB)

// Table
#table(
  columns: 4,
  table.header(
    [*Project*],
    [*Branch (commit)*],
    [*Number of commits*],
    [*Baseline commit buffer size (MB)*],
  ),
  [Git Truck@github-git-truck:online], "main (e2ba0de)", "1356", [0.36],
  [Commitizen@github-commitizen:online], "main (e177141)", "1932", [0.77],
  [Twooter@github-twooter:online], "master (2a6a407)", "234", [0.13],
  // Zeeguu API | "master (???)", "???",
)
time intervals that are meaningful:
git truck before hand in, multiple intervals
multiple projects




== Compression Distance vs. manual subjective classification

To answer RQ1

- Correlation between CD delta and complexity

== Compression Distance vs. semi automatic objective classification

Commit message often convey the intent of the commit, and can be used to semi automatically classify the commit into different categories. Some repositories even use tools like Commitizen *TODO: Add REF* to enforce a commit message format, from which it is trivial to derive the commit type.

For this experiment we therefore use keyword searching to classify the commit messages into different categories. We use the following categories:

Test Build Fix Bump Feat Refactor Style Docs



To answer RQ2



== Compression Distance aggregated over authors

To answer RQ3


=== Observations

"Reasons for skews:
- Code that was deleted again and no longer present in final version"
Intentional survivorship bias
== Limitations of compression distance

1. it's much slower to compute than traditional metrics like LoCC.

2. limited window size @cebrian2005common leading to distorted distance measurements, especially in worst case when comparing identical objects exceeding these size constraints. This means that we are back to just measuring something similar to the byte distance

== Git Truck

If you look beyond our bachelors project, where we all four worked on the project, you see that Dawid joined as a contributor during his master thesis. After that, Thomas did his master thesis on the project as well, which is very

== Considerations - what does it matter for end users

While measuring automatic velocity is a good idea, it is not the only thing to consider.
For a user facing project, it is important to also consider the user experience and the impact of changes on the end users. Some small bugfix might have a small impact on the code, but a large impact on the end user.
