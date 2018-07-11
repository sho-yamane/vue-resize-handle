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
      type: Object,
      "default": function() {
        return {
          height: 0,
          width: 0
        };
      }
    },
    "defaultSize": {
      type: Object,
      "default": function() {
        return {
          height: -1,
          width: -1
        };
      }
    },
    "maxSize": {
      type: Object,
      "default": function() {
        return {
          height: Number.MAX_VALUE,
          width: Number.MAX_VALUE
        };
      }
    },
    "keepRatio": {
      type: Boolean,
      "default": false
    },
    "corner": {
      type: String,
      "default": "se"
    },
    "size": {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      propsSize: this.size
    }
  },
  computed: {
    direction: function() {
      return {
        x: this.corner[1] === "e" ? 1 : -1,
        y: this.corner[0] === "n" ? -1 : 1
      };
    },
    style: function() {
      var horz, style, vert;
      style = {
        cursor: this.corner + "-resize",
        width: this.extent + "px",
        height: this.extent + "px"
      };
      horz = this.direction.x === 1 ? "right" : "left";
      vert = this.direction.y === 1 ? "bottom" : "top";
      style[vert] = -this.offset + "px";
      style[horz] = -this.offset + "px";
      return style;
    }
  },
  methods: {
    resetSize: function(e) {
      var newSize, oldSize;
      if (!e.defaultPrevented) {
        e.preventDefault();
        if ((this.defaultSize != null) && (this.defaultSize.height > -1 || this.defaultSize.width > -1)) {
          newSize = {};
          if (this.defaultSize.height > -1) {
            newSize.height = this.defaultSize.height;
          } else {
            newSize.height = this.propsSize.height;
          }
          if (this.defaultSize.width > -1) {
            newSize.width = this.defaultSize.width;
          } else {
            newSize.width = this.propsSize.width;
          }
          newSize = this.processMinMax(newSize);
          if (this.keepRatio) {
            newSize = this.processRatio(newSize);
          }
          oldSize = {
            height: this.propsSize.height,
            width: this.propsSize.width
          };
          this.propsSize.height = newSize.height;
          this.propsSize.width = newSize.width;
          this.$emit("resize", this.propsSize, oldSize, this);
          return this.$emit("reset-size");
        }
      }
    },
    dragStart: function(e) {
      if (!e.defaultPrevented) {
        e.preventDefault();
        if (e.ctrlKey && !this.keepRatio) {
          this.setRatio();
        }
        this.startSize = {
          width: this.propsSize.width,
          height: this.propsSize.height
        };
        this.dragging = true;
        this.startPos = {
          x: e.clientX,
          y: e.clientY
        };
        if (document.body.style.cursor != null) {
          this.oldCursor = document.body.style.cursor;
        } else {
          this.oldCursor = null;
        }
        document.body.style.cursor = this.style.cursor;
        this.removeMoveListener = this.onDocument("mousemove", this.drag);
        this.removeEndListener = this.onceDocument("mouseup", this.dragEnd);
        return this.$emit("resize-start", this.propsSize, this);
      }
    },
    drag: function(e) {
      var diff, newSize, oldSize;
      e.preventDefault();
      diff = {
        x: (e.clientX - this.startPos.x) * this.direction.x,
        y: (e.clientY - this.startPos.y) * this.direction.y
      };
      newSize = {
        width: this.startSize.width + diff.x,
        height: this.startSize.height + diff.y
      };
      if (e.ctrlKey || this.keepRatio) {
        if (diff.y * this.ratio > diff.x) {
          newSize.width = newSize.height * this.ratio;
        } else {
          newSize.height = newSize.width / this.ratio;
        }
      }
      newSize = this.processMinMax(newSize);
      if (e.ctrlKey || this.keepRatio) {
        newSize = this.processRatio(newSize);
      }
      oldSize = {
        height: this.propsSize.height,
        width: this.propsSize.width
      };
      this.propsSize.height = newSize.height;
      this.propsSize.width = newSize.width;
      return this.$emit("resize", this.propsSize, oldSize, this);
    },
    dragEnd: function(e) {
      e.preventDefault();
      document.body.style.cursor = this.oldCursor;
      this.dragging = false;
      if (typeof this.removeMoveListener === "function") {
        this.removeMoveListener();
      }
      if (typeof this.removeEndListener === "function") {
        this.removeEndListener();
      }
      this.$emit("resize-end", this.propsSize, this);
      return true;
    },
    setRatio: function() {
      return this.ratio = this.propsSize.width / this.propsSize.height;
    },
    processMinMax: function(size) {
      if (size.width < this.minSize.width) {
        size.width = this.minSize.width;
      } else if (size.width > this.maxSize.width) {
        size.width = this.maxSize.width;
      }
      if (size.height < this.minSize.height) {
        size.height = this.minSize.height;
      } else if (size.height > this.maxSize.height) {
        size.height = this.maxSize.height;
      }
      return size;
    },
    processRatio: function(size) {
      if (size.height === this.maxSize.height && this.ratio < 1) {
        size.width = size.height * this.ratio;
      } else if (size.width === this.maxSize.width && this.ratio > 1) {
        size.height = size.width / this.ratio;
      } else if (size.height === this.minSize.height && this.ratio > 1) {
        size.width = size.height * this.ratio;
      } else if (size.width === this.minSize.width && this.ratio < 1) {
        size.height = size.width / this.ratio;
      }
      return size;
    },
    saveRatio: function(e) {
      if (!this.ratioSet && e.keyCode === 17 && this.dragging && !this.keepRatio) {
        this.setRatio();
        return this.ratioSet = true;
      }
    },
    releaseSaveRatio: function(e) {
      if (e.keyCode === 17) {
        return this.ratioSet = false;
      }
    }
  },
  ready: function() {
    if (this.keepRatio) {
      this.setRatio();
    }
    this.removeKeydownListener = this.onDocument("keydown", this.saveRatio);
    return this.removeKeyupListener = this.onDocument("keyup", this.releaseSaveRatio);
  },
  beforeDestroy: function() {
    if (typeof this.removeKeydownListener === "function") {
      this.removeKeydownListener();
    }
    return typeof this.removeKeyupListener === "function" ? this.removeKeyupListener() : void 0;
  },
  watch: {
    "minSize.width": function(val) {
      if (this.propsSize.width < val.width) {
        return this.propsSize.width = val.width;
      }
    },
    "minSize.height": function(val) {
      if (this.propsSize.height < val.height) {
        return this.propsSize.height = val.height;
      }
    },
    "maxSize.width": function(val) {
      if (this.propsSize.width > val.width) {
        return this.propsSize.width = val.width;
      }
    },
    "maxSize.height": function(val) {
      if (this.propsSize.height > val.height) {
        return this.propsSize.height = val.height;
      }
    },
    "keepRatio": function(val) {
      if (this.val) {
        return this.setRatio();
      }
    }
  }
};

if (module.exports.__esModule) module.exports = module.exports.default
;(typeof module.exports === "function"? module.exports.options: module.exports).template = "<div class=resize-handle v-bind:style=style style=\"position: absolute\" @mousedown=dragStart @dblclick=resetSize v-bind:class=\"'resize-handle-'+corner\"></div>"
