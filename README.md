# node-pearson-hash
The [Pearson](http://en.wikipedia.org/wiki/Pearson_hashing) hashing function, for node.js / io.js

## Getting it

```
npm install pearson
```

## Using it

The Pearson hashing function relies on a permutation of the integers from 0 to 255. I will hereafter call this permutation the "seed".

```js
var pearson = require('pearson');

//To generate a seed
var s = pearson.seed();

//To calculate a hash
var h = pearson(data, hashLength, seed);

```

## License

This module has been written by Ahmad Benmrad. It is released under the terms of the MIT License.
