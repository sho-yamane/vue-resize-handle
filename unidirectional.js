module.exports = {
  mixins: [require("vue-mixins/onDocument"), require("vue-mixins/onceDocument")],
  props: {
    "offset": {
      type: Number,
      "default": 0
    },
    "extent": {
      type: Number,
      "default": 10
    },
    "minSize": {
      type: Number,
      "default": 0
    },
    "defaultSize": {
      type: Number,
      "default": -1
    },
    "maxSize": {
      type: Number,
      "default": Number.MAX_VALUE
    },
    "side": {
      type: String,
      "default": "right"
    },
    "size": {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      calcSize: 0
    }
  },
  computed: {
    horizontal: function() {
      return this.side === "left" || this.side === "right";
    },
    plus: function() {
      return this.side === "right" || this.side === "bottom";
    },
    style: function() {
      var style;
      if (this.horizontal) {
        style = {
          width: this.extent + "px",
          height: "100%",
          top: "0",
          cursor: "ew-resize"
        };
      } else {
        style = {
          width: "100%",
          height: this.extent + "px",
          left: "0",
          cursor: "ns-resize"
        };
      }
      style[this.side] = -this.offset + "px";
      return style;
    }
  },
  methods: {
    resetSize: function(e) {
      var oldSize;
      if (!e.defaultPrevented) {
        e.preventDefault();
        if (this.defaultSize > -1) {
          oldSize = this.size;
          if (this.defaultSize < this.minSize) {
            this.calcSize = this.minSize;
          } else if (this.defaultSize > this.maxSize) {
            this.calcSize = this.maxSize;
          } else {
            this.calcSize = this.defaultSize;
          }
          this.$emit("resize", this.calcSize, oldSize, this);
          return this.$emit("reset-size");
        }
      }
    },
    dragStart: function(e) {
      if (!e.defaultPrevented) {
        e.preventDefault();
        this.startSize = this.size;
        if (this.horizontal) {
          this.startPos = e.clientX;
        } else {
          this.startPos = e.clientY;
        }
        if (document.body.style.cursor != null) {
          this.oldCursor = document.body.style.cursor;
        } else {
          this.oldCursor = null;
        }
        document.body.style.cursor = this.style.cursor;
        this.removeMoveListener = this.onDocument("mousemove", this.drag);
        this.removeEndListener = this.onceDocument("mouseup", this.dragEnd);
        return this.$emit("resize-start", this.size, this);
      }
    },
    drag: function(e) {
      var moved, newSize, oldSize, pos;
      e.preventDefault();
      if (this.horizontal) {
        pos = e.clientX;
      } else {
        pos = e.clientY;
      }
      moved = pos - this.startPos;
      if (!this.plus) {
        moved = -moved;
      }
      newSize = this.startSize + moved;
      if (newSize < this.minSize) {
        newSize = this.minSize;
      } else if (newSize > this.maxSize) {
        newSize = this.maxSize;
      }
      oldSize = this.size;
      this.calcSize = newSize;
      return this.$emit("resize", this.calcSize, oldSize, this);
    },
    dragEnd: function(e) {
      e.preventDefault();
      document.body.style.cursor = this.oldCursor;
      if (typeof this.removeMoveListener === "function") {
        this.removeMoveListener();
      }
      if (typeof this.removeEndListener === "function") {
        this.removeEndListener();
      }
      this.$emit("resize-end", this.calcSize, this);
      return true;
    }
  },
  watch: {
    "minSize": function(val) {
      if (this.size < val) {
        return this.calcsize = val;
      }
    },
    "maxSize": function(val) {
      if (this.size > val) {
        return this.calcSize = val;
      }
    }
  }
};

if (module.exports.__esModule) module.exports = module.exports.default
;(typeof module.exports === "function"? module.exports.options: module.exports).template = "<div class=resize-handle v-bind:style=style style=\"position: absolute\" @mousedown=dragStart @dblclick=resetSize v-bind:class=\"'resize-handle-'+side\"></div>"
