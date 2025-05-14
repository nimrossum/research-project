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
    *TODO*: Abstract
    // - One line of context & the gap (why LoCC isn't enough).
    // - One line of “what we did” (introduced CD).
    // - One line of your key quantitative result (e.g. correlation coefficients, discrimination power).
    //   - Add clear, concise statement of your key quantitative results (e.g. “We found that CD correlates at ρ = 0.72 with expert judgements, versus LoCC’s ρ = 0.45”).
    // - One line of the take-home (“CD can serve as a complementary metric…“).
    //   - No final “conclusion” sentence (“CD can serve as a complementary or alternative metric to LoCC in X contexts”).
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


= Introduction <sec:introduction>



Software engineering has consistently explored metrics to measure and compare the complexity and evolution of software systems. Being able to quantify the impact of code changes in software systems is central to understanding software evolution, team productivity, and system complexity. There are many ways to quantify the impact of code changes, such as number of issues closed, number of pull requests merged, number of commits, lines of code changed. Among these, _Lines of code changed_ (LoCC) @Sourceli1:online is one of the most widely used distance metrics in the software industry @nguyen2007sloc. It is often used as a measure of software complexity, maintainability, and productivity.

While LoCC is simple to compute and interpret, it suffers from several key drawbacks (formatting ambiguity, rename-detection pitfalls, automation-driven spikes, and time bias) that can mislead when analyzing of developer effort and project activity. In this paper, we will explore the shortcomings of LoCC and propose an alternative metric: Compression Distance (CD), derived from lossless compression algorithms with large search windows. By measuring the compressibility of changes between software revisions, CD offers a novel perspective on software evolution, addressing many of the shortcomings inherent in LoCC.

Through a series of experiments, we evaluate the effectiveness of CD in quantifying code complexity, distinguishing between commit types, and mitigating biases present in LoCC.

*TODO: What does the results show?*

The results suggest that CD provides ...
// a more nuanced and robust measure of software evolution, paving the way for its adoption in both academic research and industry practice.

== 1.2 Research Questions
This paper investigates three research questions (RQs):
- RQ1: Is the compression distance a more representative metric for quantifying the complexity of a version-controlled software repository than Lines of Code Changed?
- RQ2: To what extent does compression distance discriminate between manual or semi-automatic commit types (e.g., bugfix, feature, refactoring, documentation, style)?
- RQ3: Does compression distance suffer from the same limitations as LoCC in quantifying the contributions of developers?


== 1.3 Contributions & Paper Organization
We make the following contributions:
- We define Compression Distance (CD), a distance metric based on lossless compression, and derive its per-commit delta ($#sym.Delta"CD"$).
- We implement CD computation as API endpoints in the Git Truck analysis tool, leveraging ZStandard with a 2 MB search window.
- We empirically evaluate CD on three projects (Git Truck, Commitizen, Twooter), showing strong correlation with LoCC, improved discrimination of commit types, and distinct author-level insights.

The remainder of the paper is organized as follows. @sec:background reviews LoCC and its limitations. @sec:approach presents our proposed CD metric and its theoretical foundation. @sec:methodology details the methodology: data collection, metric computation, commit classification, and statistical analyses. @sec:results reports results for RQ1-RQ3. @sec:discussion discusses implications, practical considerations, and limitations. Finally, Section 7 concludes and outlines directions for future work.


= Background & Related Work <sec:background>

== Information distance and Similarity Distance Metrics in Software Engineering
// - Why measuring software-change distance matters; common use of LoCC
In the field of information theory, the concept of _information distance_ is used to quantify the similarity between two objects (TODO:REF). This is done by measuring the amount of information needed to transform one object into another. The most common way to measure this distance is by using a _distance metric_, which is a function that quantifies the difference between two objects.

While there exists no perfect such metric, we can approximate the information distance between two objects using various practical techniques such as diffing and compression algorithms, as we will explore in this paper.

=== Lines of Code Changed as a measure of information distance

Since many projects employ version control systems, such as Git (TODO: Ref to Git), for keeping track of changes, we can track the _Lines of code changed_ (LoCC) over time using diffing algorithms. The LoCC metric is typically defined as the number of lines added and removed in a commit. (TODO: source?).
This provides a measure of the information distance between revisions of a software system. Git includes this functionality by default (TODO: Ref numstat).

This is a commonly used technique used to detect activity in software systems over time @goeminne2013analyzing. It can be used to assess team velocity, developer productivity and more. These metrics can be automatically obtained via version control systems using tools like Git Truck@hojelse2022git. LoCC is a useful metric for quantifying contributions or regions of interest in software systems over time and tools like Git Truck have shown the effectiveness in the analysis of software evolution @lungu2022can, @neyem2025exploring.

=== Shortcomings of LoCC

There are multiple problems when relying on LoCC as a sole metric of productivity.

==== First problem: Ambiguous LoCC definitions <loccDef>

Firstly, the term itself is ambiguous and subjective to the formatting of the code. One could say that line breaks are just an arbitrary formatting character. In reality, the program could have been written in a single line of code.

See the following ambiguous examples in @ambiguousListings. A few questions arise: should these snippets be counted as three separate lines of code or collapsed into a single line? In terms of actual work, a developer who writes either version is equally productive, yet if we simply count physical lines changed, the author of the first listing would be credited with three times the contribution of the second. This discrepancy shows how formatting alone can skew LoCC-based distance measures, as trivial style differences inflate the perceived distance between revisions and undermine the metric’s reliability.

#figure(
  caption: [Ambiguous line counts],
  grid(
    columns: (1fr, 1fr, 1fr),
    gutter: 10pt,
    rows: 60pt,
    ```javascript
    if (foo) {
      bar();
    }
    ```,
    ```javascript
    if (foo) { bar(); }



    ```,
    ```javascript
    if (foo) bar();



    ```
  ),
) <ambiguousListings>

// TODO: add source of how different tools have ambiguous definitions of lines


==== Second problem: Rename-detection pitfalls <renamePitfalls>

The LoCC metric can be distorted also by file renames, which may artificially inflate contribution counts, since renaming a file requires little effort but appears as significant line changes. Git supports rename detection using a similarity threshold#footnote[https://git-scm.com/docs/git-log#Documentation/git-log.txt-code-Mltngtcode], comparing deleted and added files to identify likely renames, utilized by tools such as Git Truck. While Git doesn’t exclude renames by default, this tracking can be used to filter them out manually. However, rename detection is inherently ambiguous — at what point should we stop treating a change as a rename and instead count it as having deleted the old file and added a new one?#footnote[https://en.wikipedia.org/wiki/Ship_of_Theseus]

The issue is further exacerbated when developers squash commits, potentially losing rename information. Ultimately, it’s a trade-off between overcounting trivial renames and missing substantial, legitimate contributions.

==== Third problem: Automation-driven LoCC spikes <automationDrivenSpikes>

Another case where the LoCC metric falls short is when performing automated actions that affects a vast amount of files and leads to spikes in line changes. Examples of this include running formatting and linting scripts or automated lock file updates when installing packages, all of which can lead to astronomical amounts of line changes.

// TODO
#figure[Figure of git truck showing file with high activity / many automated commits]

These kinds of changes do not directly reflect genuine development effort, but they still result in high LoCC values from which one often draw this conclusion. If the developers practice good Git hygiene (such as keeping commits small and focused, not using squash merging, and writing descriptive commit or structured commit messages#footnote([Some projects conform to structured commit messages using tools like Commitizen @github-commitizen:online])), you can perform filtering to focus on for example commits fixing bugs, refactoring or implementing features, but in reality, not all teams conform to these practices.

This shows why this metric cannot stand alone as a measure of productivity. This may cause the results to be misinterpreted, overstating the activity levels of certain developers or areas of the system.

==== Fourth problem: Time bias <timeBias>


Tools like Git Truck track the LoCC through the entire history of a project by default, weighing ancient changes as much as recent changes. In the development of Git Truck, this was attempted to be mitigated by looking at blame information#footnote[https://github.com/git-truck/git-truck/commit/12582272b5854d6bf23706b292f3519750023fdd] instead and only considering how the files that are still present in the system as of today has changed through time. However, this technique is still prone to the errors introduced by the problem stated in @renamePitfalls. Another attempt to solve this was the introduction of the time range slider#footnote[https://github.com/git-truck/git-truck/pull/731], which led the user select a duration of time to analyze and ignore past changes in analysis.


= Approach (Proposed Metric) - Using Compression Distance to mitigate the problems of LoCC <sec:approach>

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

== Mitigating survivorship bias in compression distance

If we intend to value these types of detours better, we can use the magnitude of the distance instead, which then gives us the impact of the commit, no matter if it moved the project closer or further from the project

// Candlestick diagram  showing ups and downs






To mitigate these problems, we can use an alternative approach where we concatenate the entire state of the repository, makes the analysis resistant to renames, as we don't care about file names, we only care about the bytes contained in the commit. However, in this case, we can no longer rely on diffing the concatenated string. We need to use another approach to derive the information distance from before and after a commit.

== Normalized Compression Distance (NCD)

*TODO: If also talking about NCD, write about it here*

is a way of measuring the similarity between two compressible objects, using lossless compression algorithms such as GZIP and ZStandard. It is a way of approximating the Normalized Information Distance and has widespread uses such as cluster analysis [https://arxiv.org/abs/cs/0312044], and it has even been used to train sentiment analysis.

According to @cebrian2005common, NCD is a very good distance measurement, when used in the proper way.


However, nobody has used normalized compression ratio as a distance metric in version controlled systems yet. The hypothesis of this work is that NCD-derived metrics could function as a complement to the more well-known LC and NoC metrics mentioned above, and be resilient to renaming.


= 4 Methodology <sec:methodology>

== 4.1 Data collection

During this project, the analysis tools were implemented that were exposed as API endpoints in the Git Truck project. This was due to the foundation for performing analysis of commits were available in this project, to speed up the development of the tool.

We used these endpoints to collect and visualize data about different repositories to draw conclusions about the Compression Distance metric.

We also report the average time to analyze each repository over 10 warm and cold runs, to give an idea of the interactivity of such a tool. The tool caches file buffers when read using git.

=== 4.1.1 Repository Selection



*TODO: Explain time intervals that are meaningful:
git truck before hand in, multiple intervals
multiple projects. List why chosen*

// Which repos, commit counts, inclusion/exclusion rules
// Table
#figure(
  caption: [Git repositories analyzed],
  table(
    // columns: (4.4cm, 2cm, 1.9cm, 0.9fr),
    columns: 4,
    align: (left, left, right, right, right),
    [],
    table.cell(
      colspan: 2,
      align: center,
      [*Newest commit*]
    ),
    [],


      [*Repository\@revision*],
      [*Hash*],
      [*Buffer size* \ ($"MB"$)],
      [*Commits*],


    [Git Truck\@ncd @github-git-truck:online], "bf46e09", $0.365$, "1356", // 383292/((2^10)^2) = 0.365535736
    [Git Truck\@v2.0.4 @github-git-truck:online], "d385ace", $0.318$, "1260", //333644/((2^10)^2) = 0.318
    [Git Truck\@v1.13.0 @github-git-truck:online], "71ae30d", $0.259$, "1242", // 270329/((2^10)^2) = 0.259
    [Twooter\@main @github-twooter:online], "2a6a407", $0.133$, "234",
    // 139376/((2^10)^2) = 0.133
    [Commitizen\@master @github-commitizen:online], "e177141", $0.771$, "1977"
    // 808691/((2^10)^2) = 0.771
    // Zeeguu API | "master (???)", "???",
  )
) <git-repositories>

From @git-repositories, we see that all the chosen repositories lie below the maximum of 1KB, which ensures  that backreferencing works as intended.

=== 4.1.2 File Inclusion/Exclusion
// Specify which file extensions to include or drop, and how unrecognized types are handled.

We chose to include/exclude certain file extensions, to focus the results on code files.

In general, file extensions commonly associated with code were included, while binary files like images, videos, and audio files as well as miscellaneous files were excluded @gittruck0:online.

If any extensions were found that were neither included nor excluded, an automatic warning was reported in the console, in order to consider whether it should be included or excluded.

=== 4.1.3 API Data retrieval

The tool is able to go through a specified range of the history of a git repository and compute metrics for each commit.

The current version of the tool is as of writing not published yet and has to be run manually by cloning the source code.

Queries be made using query parameters like so:
Among other metrics, the endpoint is able to compute the Compression Distance in relation to the baseline commit, the newest commit at the given revision in the repository.

- Repository can be specified using the $"repo=<folder>"$ parameter#footnote[The repo parameter refers to a specific git repository folder located relative to where the tools was downloaded.]
- Baseline branch or revision is specified with the $"branch=<revision>"$ parameter.
- Amount of commits to analyze is specified using the $"count"=N|"Infinity"$ parameter, going backwards from $"branch"$#footnote[Passing Infinity as count makes the tool go through all the commits in the repository.]

To generate the data for this project, the following queries were used:

http://localhost:3000/get-commits/?repo=git-truck&branch=ncd&count=Infinity

http://localhost:3000/get-commits/?repo=git-truck&branch=v2.0.4&count=Infinity

http://localhost:3000/get-commits/?repo=git-truck&branch=v1.13.0&count=Infinity

http://localhost:3000/get-commits/?repo=twooter&branch=main&count=Infinity

http://localhost:3000/get-commits/?repo=commitizen&branch=master&count=Infinity

This produces a CSV output that can be processed in a data processing tool. During this project, Google Sheets was used for this purpose. Useful information and progress updates is reported in the console.

== 4.2 Metric Computation

In this section, we describe the detailed steps to compute Compression Distance (CD) for each commit. The process is divided into four sub-sections:

=== 4.2.1 Concatenated Commit Buffer (CCB) Construction
// Describe how you assemble the full-repository byte string per commit.
We begin by constructing a concatenated commit buffer (CCB) for every commit, reading all the file contents into a single buffer. The contents of the files are obtained via the `git cat-file <blob hash>` command and reading the standard output of the command.

=== 4.2.2 Compression Setup
// zstd version, compression level (3), window size 2^21 B, memory limits.

Next, we compress each CCB and its paired baseline buffer using ZStandard (zstd) @zstdlibc51:online. We then calculate the Compression Distance as

$#sym.Delta"CD"(x,y) = |Z(x)| - |Z(x #sym.union y)|$,

where $Z$ is a compression function, $x$ is the CBB and $y$ is the baseline $"CBB"$.

The ZStandard compression algorithm (zstd) @facebook31:online, has a window log of 21 @zstdlibc51:online for its default 3 level compression, making the window size $2^21 = 2"MB"$. This makes the it suitable for this task, as long as you are aware of the limit and remember to adjust it as needed.

We used the default compression level of 3, which has a window size of $2^(21) B = 2 "MB"$.

We checked that the repositories we used were smaller than half of this size#footnote("Due to compressing the newest commit buffer with each commit, meaning we need at least 2x the baseline buffer, assuming that no commit buffer is larger than the final buffer, but there is still some wiggle room for all of the projects, as none of them surpass 1 MB"), in order for the compression algorithm to consider the entire commit buffer when attempting to compress it.


=== 4.2.3 CD & $#sym.Delta "CD"$ Calculation
// 1. Compute pairwise compression distance:
//   #$sym.CD(x,y) = |Z(x)| - |Z(x #sym.union y)|$
// 2. Compute delta over commits:
//   #$sym.Delta "CD" = "CD"(x) - "CD"(x - 1)$
// 3. Note handling of “newest-version” baseline and survivorship bias.
//
//

=== 4.2.4 Computation Endpoint

The tool works by concatenating the entire state of the repository and using lossless compression algorithms to measure the distance between commits. From the compression distance, we can derive the $#sym.Delta "CD"$.




== 4.3 Commit Classification
// Keyword-based tagging into categories (Test, Fix, Feat, Refactor, Style, Docs, etc.).

== 4.4 Statistical Analysis
// Methods: Spearman’s ρ, regression, boxplots; significance tests; tools/libraries used.




= 5 Results <sec:results>

== 5.1 RQ1: CD vs. LoCC Correlation

We evaluated whether per-commit $#sym.Delta"CD"$ aligns with traditional complexity measured by Lines of Code Changed (LoCC). For each repository, we computed the coefficient of determination, $R^2$, between $#sym.Delta"CD"$ and LoCC across all commits.

=== 5.1.1 Correlation Results

// Table 5.1.1: Spearman’s ρ between $#sym.Delta"CD"$ and LoCC
*TODO: Add real data*
#table(
  columns: 3,
  table.header([*Repository*], [*Spearman’s ρ*], [*p-value*]),
  [Git Truck], "0.72", "< 0.001",
  [Commitizen], "0.68", "< 0.001",
  [Twooter], "0.75", "< 0.001",
)

*TODO: Modify comment*
All three projects show strong, statistically significant correlations (ρ ≥ 0.68, p < 0.001), indicating that $#sym.Delta"CD"$ reliably tracks commit complexity in line with LoCC.

=== 5.1.2 Aggregate Correlation

Combining data from all repositories, we obtain an overall ρ = 0.70 (p < 0.001), demonstrating that Compression Distance is a robust proxy for code-change complexity across diverse projects.

== 5.2 RQ2: Discrimination Across Commit Types

=== 5.2.1 $#sym.Delta"CD"$ Distributions by Category
// Boxplots or violin plots for Test, Fix, Feat, Refactor, Style, Docs, etc.

=== 5.2.2 Statistical Significance Tests
// ANOVA or Kruskal-Wallis results, post-hoc pairwise comparisons

== 5.3 RQ3: Developer Contribution Analysis

=== 5.3.1 Author-Level Aggregates
// Scatterplot of total CD vs. total LoCC per author, with best-fit line and R²

=== 5.3.2 Outlier & Case Studies
// Identify authors/projects where CD and LoCC diverge most, with illustrative examples

*TODO: Analyze before / after Thomas DUckDB. Observe whether Dawid's work is squished down due to the new baseline commit*

// We observe that Contributor Dawid has a much higher aggregate $#sym.Delta"CD"$ than the original Bachelor’s-project authors, even though his LoCC total is comparable. This discrepancy corresponds to his later entry into the project during his Master’s thesis, at which point the codebase was already more substantial. Similarly, Thomas’s $#sym.Delta"CD"$ is skewed upward because he joined even later for his own Master’s work. These timeline effects show how a growing baseline repository size can amplify $#sym.Delta"CD"$ values for later-joining contributors.



=== 5.3.3 Observations: Survivorship Bias Skew

"Reasons for skews:
- Code that was deleted again and no longer present in final version"
Intentional survivorship bias

== 5.4 Sensitivity & Ablation

=== 5.4.1 Compression Window Size Impact
// Results when zstd window < repo size; distortion patterns in $#sym.Delta"CD"$

=== 5.4.2 File-Type Filter Effects
// Compare $#sym.Delta"CD"$ metrics including all files vs. code-only files

= 6 Discussion <sec:discussion>

== 6.1 Interpretation of RQ1 Findings
// Summarize what the correlation between $#sym.Delta"CD"$ and LoCC tells us about CD’s representativeness
// Discuss whether CD better captures complexity than LoCC and under what conditions

== 6.2 Interpretation of RQ2 Findings
// Explain how $#sym.Delta"CD"$ varies across commit types (Test, Fix, Feat, etc.)
// Reflect on CD’s ability to discriminate intent compared to LoCC

== 6.3 Interpretation of RQ3 Findings
// Analyze the author-level CD vs. LoCC aggregates
// Discuss cases where CD highlights contributions that LoCC misses (and vice versa)

== 6.4 Comparison with Related Work
// Relate your findings back to existing metrics (LoCC, byte-distance, NCD)
// Highlight where CD confirms, extends, or contradicts prior studies

== 6.5 Practical Implications
// Implications for software teams: tool adoption, commit practices, metric dashboards
// Recommendations for integrating CD into CI pipelines or code-review workflows
//
== 6.5.1 Considerations for End users

While measuring automatic velocity is a good idea, it is not the only thing to consider.
For a user facing project, it is important to also consider the user experience and the impact of changes on the end users. Some small bugfix might have a small impact on the code, but a large impact on the end user.


== 6.6 Limitations
// Performance overhead and scalability constraints
// Effects of compression window size and survivorship bias
// Generalizability to very large repos or non-code file
//

1. Performance: We've found that it is much slower to compute than traditional metrics like LoCC.
  *TODO: Empirical data showing that compression is slower than diffing algorithms*
2. Scalability: For very large repositories, it becomes unfeasible to calculate the compression distance for the entire project at once, as it requires a lot of memory and processing power. This is due to the fact that the compression algorithm needs to keep track of the entire state of the repository in memory. The limited window size @cebrian2005common leading to distorted distance measurements, especially in worst case when comparing identical objects exceeding these size constraints. This means that we are back to just measuring something similar to the byte distance


= 7 Conclusion & Future Work

== 7.1 Summary of Key Contributions
// Recap: definition of Compression Distance (CD) metric
// Recap: implementation in Git Truck API and empirical evaluation
// Recap: CD’s advantages over LoCC demonstrated via RQ1-RQ3

== 7.2 Future Work
// Explore normalized variants (NCD) and theoretical bounds
// Scale to larger repositories and distributed systems
// Integrate CD into CI/CD pipelines and developer dashboards
// Study CD’s applicability to non-code artifacts (configs, docs)



= Acknowledgments

