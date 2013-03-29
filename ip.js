/**
 * @fileOverview This file contains a library for handling IP addresses.
 * @author Oleg Sklyanchuk
 * @version 0.2.0
 */

/*jslint browser: true, node: true, bitwise: true */
/*globals define */

// ------------------
// TODO:
// 1. IPv6
// 2. Performance (avoid duplication of method calls)
// 3. `contains` method should include broadcast IP address?
// ------------------

// ip(2130706433).toString(); // '127.0.0.1'
// ip('127.0.0.1').valueOf(); // 2130706433
// 
// ip('127.0.0.1') > ip('127.0.0.2') // false
// ip('127.0.0.1') < ip('127.0.0.2') // true
// 
// ip('127.0.0.1').mask('255.255.255.0'); // same as below
// ip('127.0.0.1').mask(24); // same as above
// ip('127.0.0.1').mask('24'); // same as above
// ip('127.0.0.1').mask('255.255.255.0').contains('127.0.0.5'); // true
// ip('127.0.0.1').mask('255.255.255.0').contains(2130706433); // true
// ip('127.0.0.1').mask('255.255.255.0').size; // 256
// ip('127.0.0.1').mask('255.255.255.0').first; // 127.0.0.1
// ip('127.0.0.1').mask('255.255.255.0').last; // 127.0.0.254
// ip('127.0.0.1').mask('255.255.255.0').broadcast; // 127.0.0.255
// ip('127.0.0.1').mask('255.255.255.0').toString(); // 127.0.0.1/24

// Universal Module Definition for CommonJS, AMD, and browser globals:
(function (root, factory) {
    'use strict';
    if (typeof require === 'function' && module && typeof module === 'object' &&
            module.exports && typeof module.exports === 'object') {
        module.exports = factory(); // CommonJS
    } else if (typeof define === 'function' && define.amd) {
        define(factory); // AMD
    } else {
        root.ip = factory(); // browser global
    }
}(this, function () {
    'use strict';

    /**
     * Converts an IPv4 address written in dot-decimal notation to number.
     * @param  {String} ipv4DotNotation IPv4 address as dot-decimal notation.
     * @throws {TypeError}              If ipv4DotNotation is not a String.
     * @throws {Error}                  If the IP address is invalid.
     * @return {Number}                 The IPv4 address in numeric form.
     */
    function ipv4DotNotationToNumber(ipv4DotNotation) {
        var ipv4Numeric = 0,
            decimals,
            decimal,
            i;
        // Avoid type conversion ambiguities by enforcing the valid type:
        if (typeof ipv4DotNotation !== 'string') {
            throw new TypeError('Expected ipv4DotNotation argument type to be' +
                ' "string". Got "' + typeof ipv4DotNotation + '" instead.');
        }
        // Avoid usage of complex regular expressions; instead attempt splitting
        // the human-readable into decimals and rely on validation performed
        // later on every individual decimal:
        decimals = ipv4DotNotation.split('.');
        for (i = 0; i < 4; i += 1) {
            decimal = parseInt(decimals[i], 10);
            // Check for NaN (NaN !== NaN) and for decimal outside of range:
            if (decimal !== decimal || decimal < 0 || decimal > 255) {
                throw new Error('Invalid IPv4 address "' + ipv4DotNotation +
                    '".');
            }
            ipv4Numeric = (ipv4Numeric * 256) + decimal;
        }
        return ipv4Numeric;
    }

    /**
     * Converts an IPv4 address given as number to dot-decimal notation form.
     * @param  {Number} ipv4Numeric IPv4 address in numeric form.
     * @throws {TypeError}          If ipv4Numeric is not a String.
     * @throws {Error}              If the IPv4 address is invalid.
     * @return {String}             The IPv4 address in dot-decimal notation.
     */
    function ipv4NumberToDotNotation(ipv4Numeric) {
        var ipv4DotNotation,
            i = 4;
        // Avoid type conversion ambiguities by enforcing the valid type:
        if (typeof ipv4Numeric !== 'number') {
            throw new TypeError('Expected ipv4Numeric argument type to be' +
                ' "number". Got "' + typeof ipv4Numeric + '" instead.');
        }
        // IPv4 addresses span from 0 (0.0.0.0) to 4294967295 (255.255.255.255):
        if (ipv4Numeric < 0 || ipv4Numeric > 4294967295) {
            throw new Error('Invalid IPv4 address ' + ipv4Numeric + '.');
        }
        // It is now safe to proceed with calculations:
        ipv4DotNotation = ipv4Numeric % 256;
        while ((i -= 1) > 0) {
            ipv4Numeric = Math.floor(ipv4Numeric / 256);
            ipv4DotNotation = (ipv4Numeric % 256) + '.' + ipv4DotNotation;
        }
        return ipv4DotNotation;
    }

    /**
     * Returns an object with properties describing the given IP address.
     * @private
     * @param  {String|Number} address IP address.
     * @return {Object}                IP address description object.
     */
    function ip(address) {
        var numeric, // numeric value of the given IP address
            notation; // human-readable notation

        // Figure out the way the IP address argument is passed; could be String
        // or Number; could be IPv4 or IPv6:
        if (typeof address === 'string') {
            numeric = ipv4DotNotationToNumber(address);
            notation = address;
        } else if (typeof address === 'number') {
            notation = ipv4NumberToDotNotation(address);
            numeric = address;
        } else {
            throw new TypeError('Unexpected IP address argument type.');
        }

        return {
            valueOf: function () {
                return numeric;
            },
            toString: function () {
                return notation;
            }
        };
    }

    /**
     * Validates and normalizes netmask as subnet prefix.
     * @param  {String|Number} netmask Netmask as number, numeric string, or
     *                                 dot-delimited notation.
     * @return {Number|Null}           Numeric network prefix or null on error.
     */
    function netmaskToPrefixSize(netmask) {
        var lastIndexOfOne, firstIndexOfZero;
        // Netmask will usually be passed as String in dot notation, e.g.
        // "255.255.255.0", but may equally be a numeric String such as "24":
        if (typeof netmask === 'string') {
            // Quick check for dot notation:
            if (netmask.indexOf('.') !== -1) {
                netmask = ip(netmask).valueOf().toString(2);
                lastIndexOfOne = netmask.lastIndexOf('1');
                firstIndexOfZero = netmask.indexOf('0');
                return (lastIndexOfOne !== -1 && firstIndexOfZero !== -1 &&
                        lastIndexOfOne < firstIndexOfZero)
                    ? firstIndexOfZero
                    : null;
            } else {
                netmask = parseInt(netmask, 10);
                // Returning here instead of the main function body to avoid
                // an extra typeof check:
                return (netmask === netmask && netmask >= 0 && netmask <= 32)
                    ? netmask
                    : null;
            }
        }
        // Alternatively the netmask could be provided as a number; we just
        // need to check if it's valid:
        return (netmask === netmask && typeof netmask === 'number' &&
                netmask >= 0 && netmask <= 32)
            ? netmask
            : null;
    }

    /**
     * Returns a subnet description object.
     * @private
     * @param  {number}        ipNumeric An IP address in its numeric form.
     * @param  {String|Number} netmask   Netmask.
     * @return {Object}                  Subnet description object.
     */
    function subnet(ipNumeric, netmask) {

        var first,
            last,
            firstNumeric,
            lastNumeric,
            network,
            networkNumeric,
            prefixSize = netmaskToPrefixSize(netmask), // number of shared bits
            bits = 32 - prefixSize,
            maskedAddress = (ipNumeric & ((0xffffffff << bits) >>> 0)) >>> 0,
            size = Math.pow(2, bits),
            cidr = ipv4NumberToDotNotation(ipNumeric) + '/' + prefixSize,
            broadcast,
            broadcastNumeric;

        function valueOf() {
            return ipNumeric;
        }

        function toString() {
            return cidr;
        }

        /**
         * Determines if an IPv4 address is contained within a given range.
         * @param  {String|Number} address IPv4 address.
         * @return {Boolean}               True if IP address is in range.
         */
        function contains(address) {
            address = ip(address);
            return (address >= (networkNumeric || firstNumeric) &&
                    address <= (broadcastNumeric || lastNumeric));
        }

        if (prefixSize < 31) {
            firstNumeric = maskedAddress + 1;
            lastNumeric = maskedAddress + size - 2;
            broadcastNumeric = maskedAddress + size - 1;
            networkNumeric = maskedAddress;
            first = ipv4NumberToDotNotation(firstNumeric);
            last = ipv4NumberToDotNotation(lastNumeric);
            network = ipv4NumberToDotNotation(networkNumeric);
            broadcast = ipv4NumberToDotNotation(broadcastNumeric);
        } else {
            firstNumeric = ipNumeric;
            lastNumeric = maskedAddress + size - 1;
            first = ipv4NumberToDotNotation(firstNumeric);
            last = ipv4NumberToDotNotation(lastNumeric);
        }

        return {
            contains: contains,
            size: size,
            network: network,
            first: first,
            last: last,
            broadcast: broadcast,
            valueOf: valueOf,
            toString: toString
        };
    }

    /**
     * Main constructor.
     * @param  {String|Number} address IPv4/6 addr in numeric or notation form.
     * @return {Object}                IP address description object.
     */
    return function (address) {
        address = ip(address);
        address.mask = function (netmask) {
            return subnet(address.valueOf(), netmask);
        };
        return address;
    };
}));