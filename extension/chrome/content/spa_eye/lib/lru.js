define([
    'firebug/lib/trace'
], function(FBTrace) {

    // Most Used
    // -------------------------
    //
    // var mu = new MostUsed({limit: 4});
    // mu.add("c1", "model1"); // NodeObject({key: c1, value: model1})
    // mu.add("c2", "model2");
    // mu.add("c3", "model3");
    // mu.add("c4", "model4");
    // mu.toString();
    // mu.get("c3");  // "model3"
    // mu.toString();
    // mu.add("c5", "model5");
    // mu.add("c5", "model5", "set");
    // mu.toString(); // c4 <- c3 <- c2 <- c5


    // each node for Mostused
    var Node = function(key, value) {
        this.key = key;
        this.value = value;

        this.saveHit = 0;
        this.setHit = 0;
        this.fetchHit = 0;
    };
    Node.prototype = {
        constructor: Node,
        hit: function() {
            return this.saveHit + this.setHit + this.fetchHit;
        }
    };

    var MostUsed = function(options) {
        if (!(this instanceof MostUsed)){
            return new MostUsed(options);
        }
        options = options || {};
        this.limit = options.limit || 10;
        this.options = options;
        this.allMap = options.allMap || {};

        this.reset();
    };

    MostUsed.prototype = {
        constructor: MostUsed,

        // add value
        add: function(key, value, type) {
            if (!key) {
                throw new Error("Null is not permitted for key");
            };

            // key is already present.
            var node = this.get(key);
            if (!node) {
                node = new Node(key, value);
                this.allMap[node.key] = node;
            }

            if (!type) return node;

            node[type+'Hit']++;
            if (this.dataList.indexOf(node) !== -1) {
                return node;
            }

            if (this.dataList.length >= this.limit) {
                this._makeHit(node);
            } else {
                this.dataList.push(node);
                this.options.onAdd && this.options.onAdd.call(this, node, this);
            }
            return node;
        },

        get: function(key) {
            return this.allMap[key];
        },

        _makeHit: function(node) {
            var nh = node.hit();
            var found = false;
            for (var i = 0; i < this.dataList.length; i++) {
                var eachNode = this.dataList[i];

                // If `eachNode` has less hit than up coming `node`,
                // replace it with new `node`
                if (eachNode.hit() < nh) {
                    this.dataList[i] = node;

                    // call options.purge for outside world
                    found = true;
                    this.options.onPurge && this.options.onPurge.call(this, eachNode, this);
                    this.options.onAdd && this.options.onAdd.call(this, node, this);
                    break;
                }
            }
            if (!found) {
                this.options.onPurge && this.options.onPurge.call(this, node, this);
            }
            return node;
        },

        reset: function() {
            // data for node
            this.dataList = [];
        },

        compare: function(n1, n2) {
            if (n1 && n2) {
                if (n1.hit() > n2.hit()) {
                    return -1;
                }

                if (n1[key] < n2[key]) {
                    return 1;
                }
            }
            return 0;
        },

        remove: function(key) {
            var node = this.get(key);
            if (node){
                var index = this.dataList.indexOf(node);
                if (index !== -1) {
                    this.dataList.splice(index, 1);
                }
            }
            return node;
        },

        sort: function() {
            this.dataList.sort(compare);
            return this.dataList;
        },

        keys: function() {
            return this.dataList.map(function(node){
                return node.key;
            });
        },

        values: function() {
            return this.dataList.map(function(node){
                return node.value;
            });
        },

        forEach: function(){
            this.dataList.forEach.apply(this.dataList, arguments);
        },

        toString: function(){
            var result = null;
            this.forEach(function(node, index){
                if (result) {
                    result = " <- " + result;
                }
                result = node.key + "["+ node.hit() +"]" + (result ? result : "");
            });
            return result;
        }
    };

    return MostUsed;
});
