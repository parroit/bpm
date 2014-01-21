'use strict';

var expect = require("expect.js");
var bpm = require("../lib/bpm");


describe("bpm", function () {
    it("is defined", function () {
        expect(bpm).to.be.an('object');
    });
});
