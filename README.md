UBER
====

The University of Basel Exercise Raider keeps track of new exercise and lecture sheets
come online over the semester. Configure once, run periodically and avoid downloading
things manually. Because doing things manually sucks.

The idea is to check websites for new sheets by using jQuery to find out file URLs.
You can add the ability to check new websites by writing a parser similar to 
[this example](https://github.com/theonlyulti/fg.uber/blob/master/parsers/grundlagen-der-programmierung-hs12.js).


Install
-------

1. install node.js
2. checkout repository
3. `cd` into it
4. install required packages:
   ```bash
   npm install
   ```
5. configure
   ```bash
   mv config.json.example config.json
   vim config.json
   ```
6. run `./uber.js`
