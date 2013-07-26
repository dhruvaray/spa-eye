define([], function(){

    // Least Recently Used (LRU)
    // -------------------------
    //
    // var lru = new LRU({limit: 4});
    // lru.add("c1", "model1"); // NodeObject({key: c1, value: model1})
    // lru.add("c2", "model2");
    // lru.add("c3", "model3");
    // lru.add("c4", "model4");
    // lru.toString(); // c1 <- c2 <- c3 <- c4
    // lru.get("c3");  // "model3"
    // lru.toString(); // c1 <- c2 <- c4 <- c3
    // lru.add("c5", "model5");
    // lru.toString(); // c2 <- c4 <- c3 <- c5


    // each node for LRU
    var Node = function(key, value) {
        this.key = key;
        this.value = value;
        this.hit = -1;

        this.prev = null;
        this.next = null;
    };
    Node.prototype = {
        constructor: Node
    };

    // Least Recently Used(LRU)
    var LRU = function(options) {
        if (!(this instanceof LRU)){
            return new LRU(options);
        }
        options = options || {};
        this.limit = options.limit || 10;
        this.options = options;

        this.reset();
    };

    LRU.prototype = {
        constructor: LRU,

        // add value
        add: function(key, value) {
            if (!key || !value) {
                throw new Error("Null is not permitted for key or value.");
            };

            // key is already present.
            var node = this.get(key, true);
            if (node) {
                return node;
            }

            // Create node
            node = new Node(key, value);
            this.dataMap[node.key] = node;
            this.size++;

            return this._add(node);
        },

        _add: function(node) {
            // First element
            if (!this.head) {
                this.head = node;
            }

            node.prev = this.tail;
            if (this.tail) {
                this.tail.next = node;
            }

            // set tail to node
            this.tail = node;

            if (this.limit < this.size && this.head) {
                // remove head
                var rn = this.remove(this.head.key);

                // call options.purge for outside world
                this.options.onPurge
                    && this.options.onPurge.call(this, rn.value, rn.key, this);
            }
            return node;
        },

        get: function(key, returnNode) {
            var node = this.dataMap[key];
            if (!node) return;
            node = this._makeHit(node);
            return returnNode ? node : node.value;
        },

        _makeHit: function(node) {
            if (this.size === 1) return node;
            this._remove(node);
            this._add(node);
            this.options.onHit
                && this.options.onHit.call(this, node.value, node.key, this);
            return node;
        },

        remove: function(key) {
            var node = this.dataMap[key];
            if (!node) {
                return;
            }
            // Delete node from dataMap
            delete this.dataMap[node.key];
            this.size--;
            return this._remove(node);
        },

        _remove: function(node) {
            // Relink previous pointer for node
            if (node.prev) { 
                node.prev.next = node.next;
            } else {
                // If node.prev is null, node was a head.
                // so, reset head
                this.head = node.next;
            }

            // Relink next pointer for node
            if (node.next) {
                node.next.prev = node.prev;
            } else {
                // If node.next is null, node was a tail.
                // so, reset tail
                this.tail = node.prev;
            }
            return node;
        },

        reset: function() {            
            // size of LRU
            this.size = 0;

            // dataMap for key/value
            this.dataMap = {};

            // properties for linked list
            this.head = this.tail = null;
        },

        keys: function() {
            return Object.keys(this.dataMap);    
        },

        values: function() {
            var result = [];
            this.forEach(function(value, key, lruObject){
                result.push(value);
            });
            return result;
        },

        forEach: function(iterator, context){
            if (typeof iterator!== 'function') return;
            var node = this.tail;
            while(node) {
                iterator.call(context || this, node.value, node.key, this);
                node = node.prev;
            }
        },

        toString: function(){
            var result = null;
            this.forEach(function(value, key, lruObject){
                if (result) {
                    result = " <- " + result;
                }
                result = key + (result ? result : "");
            });
            return result;
        }
    };

    return LRU;
});
