# Complexity Distance

$|.|$ denotes the compressed size.

$A$ and $B$ is a file, $R$ is the rest of the repository.

$AB$ denotes to concat $A$ with $B$.

Say you want to figure out how complex file $A$ is compared the rest of the repository $R$, you can compute the Normalized Compression Ratio for $A$ as follows:
n $$C_A=\frac{(|AR| - |A|)}{|R|}$$

If $A$ is easier to compress when knowing $R$, then $|AR| < |A| + |R|$ or $\frac{|AR| - |A|}{|R|} < 1$ but if there is no compression the $\frac{|AR| - |A|}{ / |R| = 1}$.
