
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