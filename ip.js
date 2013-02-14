/*jslint browser: true, bitwise: true */

// ip(2130706433).toString(); // '127.0.0.1'
// ip('127.0.0.1').valueOf(); // 2130706433
// ip('127.0.0.1') > ip('127.0.0.2') // true

// ip('127.0.0.1').mask('255.255.255.0'); // same as below
// ip('127.0.0.1').mask(24); // same as above
// ip('127.0.0.1').mask('255.255.255.0').contains('127.0.0.5'); // true
// ip('127.0.0.1').mask('255.255.255.0').contains(2130706433); // true
// ip('127.0.0.1').mask('255.255.255.0').size; // 256
// ip('127.0.0.1').mask('255.255.255.0').first; // 127.0.0.1
// ip('127.0.0.1').mask('255.255.255.0').last; // 127.0.0.254
// ip('127.0.0.1').mask('255.255.255.0').broadcast; // 127.0.0.255
// ip('127.0.0.1').mask('255.255.255.0').toString(); // 127.0.0.1/24

(function (context) {
    // ECMAScript 5 strict mode:
    'use strict';

    // Avoid replacing "ip" property if it already exists in the context:
    if (!context || typeof context.ip !== 'undefined') { return; }

    /**
     * Converts an IPv4 address written in dot-decimal notation to number.
     * @param  {String} dotNotation IPv4 address in dot-decimal notation form.
     * @return {Number}             IPv4 address in numeric form.
     */
    function ipv4DotNotationToNumber(dotNotation) {
        var result = 0,
            decimals,
            decimal,
            i;
        // Avoid type conversion ambiguities by enforcing the valid type:
        if (typeof dotNotation !== 'string') {
            throw new TypeError('Expected notation argument type is String.');
        }
        // Avoid usage of complex regular expressions and validate only when
        // and what is necessary:
        if (dotNotation.indexOf('.') < 0) {
            throw new Error('Malformed IP address.');
        }
        // It is now safe to split the string into decimals:
        decimals = dotNotation.split('.');
        for (i = 0; i < 4; i += 1) {
            decimal = parseInt(decimals[i], 10);
            // Check for NaN (NaN !== NaN) and for decimal outside of range:
            if (decimal !== decimal || decimal < 0 || decimal > 255) {
                throw new Error('Invalid IP address.');
            }
            result = (result * 256) + decimal;
        }
        return result;
    }

    /**
     * Converts an IPv4 address given as number to dot-decimal notation form.
     * @param  {Number} number IPv4 address in numeric form.
     * @return {String}        IPv4 address in dot-decimal notation form.
     */
    function ipv4NumberToDotNotation(number) {
        var result,
            i = 3;
        // Avoid type conversion ambiguities by enforcing the valid type:
        if (typeof number !== 'number') {
            throw new TypeError('Expected number argument type is Number.');
        }
        // IPv4 addresses span from 0 (0.0.0.0) to 4294967295 (255.255.255.255):
        if (number < 0 || number > 4294967295) {
            throw new Error('Invalid IP address.');
        }
        // It is now safe to proceed with calculations:
        result = number % 256;
        while ((i -= 1) >= 0) {
            number = Math.floor(number / 256);
            result = (number % 256) + '.' + result;
        }
        return result;
    }


    function netmask(numeric, prefix) {

        var bits,
            maskedAddress,
            size,
            first,
            last,
            firstNumeric,
            lastNumeric,
            network,
            broadcast;

        function valueOf() {
            return numeric;
        }

        function toString() {
            return ipv4NumberToDotNotation(numeric) + '/' + prefix;
        }

        /**
         * Determines if an IPv4 address is contained within a given range.
         * @param  {String|Number} address IPv4 address.
         * @return {Boolean}               True if IP address is in range.
         */
        function contains(address) {
            // We are only interested in obtaining the numeric representation
            // of the given IPv4 address:
            if (typeof address === 'string') {
                address = ipv4DotNotationToNumber(address);
            } else if (typeof address === 'number') {
                // Avoid type conversion ambiguities by enforcing the valid type:
                if (typeof address !== 'number') {
                    throw new TypeError('Expected number argument type is Number.');
                }
                // IPv4 addresses span from 0 to 4294967295:
                if (address < 0 || address > 4294967295) {
                    throw new Error('Invalid IP address.');
                }
            } else {
                throw new TypeError('Unexpected IP address argument type.');
            }

            return (address >= firstNumeric && address <= lastNumeric);
        }

        prefix = parseInt(prefix, 10);

        bits = 32 - prefix;
        maskedAddress = (numeric & ((0xffffffff << bits) >>> 0)) >>> 0;

        size = Math.pow(2, bits);
        if (prefix < 31) {
            firstNumeric = maskedAddress + 1;
            lastNumeric = maskedAddress + size - 2;
            first = ipv4NumberToDotNotation(firstNumeric);
            last = ipv4NumberToDotNotation(lastNumeric);
            network = ipv4NumberToDotNotation(maskedAddress);
            broadcast = ipv4NumberToDotNotation(maskedAddress + size - 1);
        } else {
            first = ipv4NumberToDotNotation(numeric);
            last = ipv4NumberToDotNotation(maskedAddress + size - 1);
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

    function ip(address) {

        var numeric,
            notation;

        // Obtain 
        if (typeof address === 'string') {
            numeric = ipv4DotNotationToNumber(address);
            notation = address;
        } else if (typeof address === 'number') {
            notation = ipv4NumberToDotNotation(address);
            numeric = address;
        } else {
            throw new TypeError('Unexpected IP address argument type.');
        }

        function valueOf() {
            return numeric;
        }

        function toString() {
            return notation;
        }

        function mask(prefix) {
            return netmask(numeric, prefix);
        }

        return {
            valueOf: valueOf,
            toString: toString,
            mask: mask
        };
    }

    /**
     * Primary container for methods.
     * @type {Function}
     */
    context.ip = ip;

}(window));