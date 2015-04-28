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

//To generate a seed. Returns a buffer
var s = pearson.seed();

//To calculate a hash. Returns a buffer. hashLength must be an integer between 1 and 8
var h = pearson(data, hashLength, seed);

//If the seed is omitted, the function will return an {hash, seed} object containing the hash buffer and a newly generated seed
//If the hashLength is omitted, the function will generate an 8-byte long hash by default.

```

## License

This module has been written by Ahmad Benmrad. It is released under the terms of the MIT License.
