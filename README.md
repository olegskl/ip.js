ip.js
=====

IPv4 address manipulation and utility library.

Usage
-------

    <script src="ip.js"></script>
    
    <script>
        var myIP = ip('127.0.0.1'),
            myIPMask = myIP.mask(24);

        myIP.valueOf(); // 2130706433
        myIP.toString(); // '127.0.0.1'

        myIP > ip('10.10.10.10') // true

        myIPMask.toString(); // '127.0.0.1/24'

        myIPMask.contains('127.0.0.2'); // true
    </script>

License
-------

http://opensource.org/licenses/mit-license.html