
var Jessibuca = (function (e) {
  'use strict';
  function t(e, i) {
    for (var n = 0; n < i.length; n++) {
      var r = i[n];
      (r.enumerable = r.enumerable || !1),
        (r.configurable = !0),
        'value' in r && (r.writable = !0),
        Object.defineProperty(e, r.key, r);
    }
  }
  function i(e, i, n) {
    return i && t(e.prototype, i), n && t(e, n), e;
  }
  function n() {
    return (n =
      Object.assign ||
      function (e) {
        for (var t = 1; t < arguments.length; t++) {
          var i = arguments[t];
          for (var n in i)
            Object.prototype.hasOwnProperty.call(i, n) && (e[n] = i[n]);
        }
        return e;
      }).apply(this, arguments);
  }
  function r(e, t) {
    (e.prototype = Object.create(t.prototype)),
      (e.prototype.constructor = e),
      (e.__proto__ = t);
  }
  function s(e) {
    return (s = Object.setPrototypeOf
      ? Object.getPrototypeOf
      : function (e) {
          return e.__proto__ || Object.getPrototypeOf(e);
        })(e);
  }
  function o(e, t) {
    return (o =
      Object.setPrototypeOf ||
      function (e, t) {
        return (e.__proto__ = t), e;
      })(e, t);
  }
  function a(e) {
    if (void 0 === e)
      throw new ReferenceError(
        "this hasn't been initialised - super() hasn't been called"
      );
    return e;
  }
  function l(e, t) {
    return !t || ('object' != typeof t && 'function' != typeof t) ? a(e) : t;
  }
  function u(e) {
    return (
      (function (e) {
        return 'function' == typeof e;
      })(e) &&
      (function (e) {
        var t = (function (e) {
          var t,
            i = e.toString();
          try {
            t = s(e);
          } catch (e) {}
          return (
            (t ||
              (e.constructor && e.constructor.prototype) ||
              Object.prototype) == Object.prototype &&
            '[object Function]' == i.substring(0, '[object Function]'.length)
          );
        })(e);
        if (t) return !1;
        var i = s(e);
        if (null === i) return !0;
        var n = i.constructor;
        return (
          'function' == typeof n &&
          n.toString() === e.toString() &&
          s(n) == i
        );
      })(e)
    );
  }
  var c = function (e) {
      if (null === e || void 0 === e) return !1;
      var t = typeof e;
      return (
        'function' === t || 'object' === t || 'boolean' === t || 'string' === t
      );
    },
    h = function (e, t) {
      return e.push(t), t;
    };
  function d(e, t, i, n) {
    var r,
      s,
      o =
        ((r = []),
        (s = []),
        function e(i, u) {
          if (c(u)) {
            var d = { value: u, children: [] },
              f = (function (e) {
                if (c(e)) {
                  var t = r.indexOf(e);

                  if (-1 != t) return s[t];
                }
                return null;
              })(u);
            if (null !== f) f.children.push(i);
            else {
              var p = h(r, u),
                g = h(s, d);
              null !== u && 'object' == typeof u
                ? Object.getOwnPropertyNames(u).forEach(function (t) {
                    try {
                      e(t, u[t]);
                    } catch (e) {}
                  })
                : Array.isArray(u) &&
                  u.forEach(function (t, i) {
                    try {
                      e(i, t);
                    } catch (e) {}
                  });
            }
          }
        })(i, e),
        s[0]);
    n(t, o.children);
  }
  function f() {
    return (
      'undefined' != typeof window &&
      void 0 !== window.document &&
      void 0 !== window.document.createElement
    );
  }
  var p,
    g,
    v = (function () {
      function e() {}
      var t = e.prototype;
      return (
        (t.on = function (e, t, i) {
          var n;
          this._events || (this._events = {}),
            this._events[e] || (this._events[e] = []),
            ((n = this._events[e]).push || (n = this._events[e] = [n])).push({
              callback: t,
              context: i,
            });
        }),
        (t.off = function (e, t, i) {
          if (this._events && e) {
            if (!t && !i) return (this._events[e] = void 0), !1;
            var n = this._events[e],
              r = n.length,
              s = n.slice();
            if (t || i) {
              for (var o = 0; o < r; o++) {
                var a = s[o];
                if ((t && t === a.callback) || (i && i === a.context)) {
                  n.splice(o, 1);
                  break;
                }
              }
              return s.length > n.length;
            }
          }
        }),
        (t.trigger = function (e) {
          for (
            var t,
              i,
              n,
              r,
              s,
              o = [],
              a = arguments.length,
              l = new Array(a > 1 ? a - 1 : 0),
              u = 1;
            u < a;
            u++
          )
            l[u - 1] = arguments[u];
          if (this._events && e && this._events[e]) {
            for (
              i = (t = this._events[e]).length,
                n = t.slice(),
                o = new Array(i),
                s = 0;
              s < i;
              s++
            )
              o[s] = n[s];
            for (s = 0; s < i; s++) {
              try {
                (r = o[s]).callback.apply(r.context, l);
              } catch (e) {
                console.error(e);
              }
            }
          }
          return !0;
        }),
        i(e, [
          {
            key: 'events',
            get: function () {
              return this._events;
            },
          },
        ]),
        e
      );
    })();
  function m(e) {
    try {
      return (
        (p = 'undefined' == typeof crypto ? self.crypto : crypto),
        (g = new Uint8Array(21)),
        function (e) {
          if ((e |= 0) > 21)
            throw new Error(
              'crypto.getRandomValues() not supported. But the fallback is not suitable for cryptographic purposes.'
            );
          return (
            (function (e, t) {
              for (; e < t; ) {
                var i = p.getRandomValues(g);
                e += 21;
              }
            })(0, e),
            g.slice(0, e)
          );
        }
      );
    } catch (t) {
      return function (t) {
        for (var i = [], n = 0; n < t; n++) i.push(e());
        return i;
      };
    }
  }
  var _ = function (e, t, i) {
      void 0 === e && (e = Math.random), void 0 === t && (t = 21);
      var n = m(e),
        r = '';
      for (
        i || (i = 'ModuleSymbhasOwnPr-0123456789ABCDEFGHNRVfgctiUvz_KqYTJkLxpZXIjQW');
        t--;

      )
        r += i[(64 * e()) | 0];
      return r;
    },
    w = (function (e) {
      function t() {
        return e.apply(this, arguments) || this;
      }
      return r(t, e), t;
    })(v);
  function b(e) {
    if (console) {
      var t = 'Jessibuca';
      (t += e ? ' > ' + e : ''), console.log.apply(console, [t].concat(S(arguments, 1)));
    }
  }
  function y(e) {
    if (console) {
      var t = 'Jessibuca';
      (t += e ? ' > ' + e : ''),
        console.warn.apply(console, [t].concat(S(arguments, 1)));
    }
  }
  function k(e) {
    if (console) {
      var t = 'Jessibuca';
      (t += e ? ' > ' + e : ''),
        console.error.apply(console, [t].concat(S(arguments, 1)));
    }
  }
  function S(e, t) {
    return (
      (function (e) {
        if (Array.isArray(e)) return e;
      })(e) ||
      (function (e, t) {
        if ('undefined' != typeof Symbol && Symbol.iterator in Object(e)) {
          var i = [],
            n = !0,
            r = !1,
            s = void 0;
          try {
            for (
              var o, a = e[Symbol.iterator]();
              !(n = (o = a.next()).done) &&
              (i.push(o.value), !t || i.length !== t);
              n = !0
            );
          } catch (e) {
            (r = !0), (s = e);
          } finally {
            try {
              n || null == a.return || a.return();
            } finally {
              if (r) throw s;
            }
          }
          return i;
        }
      })(e, t) ||
      (function (e, t) {
        if (e) {
          if ('string' == typeof e) return E(e, t);
          var i = Object.prototype.toString.call(e).slice(8, -1);
          return (
            'Object' === i && e.constructor && (i = e.constructor.name),
            'Map' === i || 'Set' === i
              ? Array.from(e)
              : 'Arguments' === i ||
                /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(i)
              ? E(e, t)
              : void 0
          );
        }
      })(e, t) ||
      (function () {
        throw new TypeError(
          'Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.'
        );
      })()
    );
  }
  function E(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var i = 0, n = new Array(t); i < t; i++) n[i] = e[i];
    return n;
  }
  var A = {
    debug: !1,
    videoBuffer: 0.2,
    videoBufferDelay: 0.2,
    audioBuffer: 0.2,
    audioBufferDelay: 0.2,
    useMSE: !0,
    useWCS: !1,
    useOffscreen: !1,
    isNotMute: !1,
    isResize: !0,
    isFullResize: !1,
    isRotate: !1,
    timeout: 20,
    heartbeat: 5,
    heartbeatMsg: JSON.stringify({ type: 'heartbeat', data: {} }),
    heartbeatTimeout: 2,
    loadingTimeout: 10,
    loadingText: '加载中',
    loadingTimeoutText: '加载超时',
    loadingTimeoutReplay: !0,
    loadingTimeoutReplayCallback: function () {},
    supportDblclickFullscreen: !1,
    showBandwidth: !1,
    operateBtns: {
      fullscreen: !0,
      screenshot: !0,
      play: !0,
      audio: !0,
      record: !1,
      ptz: !1,
      quality: !1,
      performance: !0,
    },
    quality: [],
    performance: 'performance',
    hotKey: !0,
    recordType: 'mp4',
    recordTypeMp4UseFFmpeg: !1,
    recordTypeMP4UseMux: !0,
    recordTypeFlvUseFFmpeg: !1,
    recordTypeFlvUseMux: !0,
    recordTypeHlsMux: !1,
    recordVideo: !1,
    recordAudio: !1,
    forceNoOffscreen: !1,
    wcsDomain: 'https://cdn.jsdelivr.net/npm/jessibuca@1.0.0-rc4.1/wcs',
    decoder:
      'https://cdn.jsdelivr.net/npm/jessibuca@1.0.0-rc4.1/dist/jessibuca-decoder.js',
    decoderPath: 'jessibuca-decoder.js',
    demuxPath: 'jessibuca-demux.js',
    demuxIVF: 'jessibuca-demuxer-ivf.js',
    demuxflv: 'jessibuca-demuxer-flv.js',
    muxMP4: 'jessibuca-muxer-mp4.js',
    muxFLV: 'jessibuca-muxer-flv.js',
    muxHLS: 'jessibuca-muxer-hls.js',
    demuxflvWasm: 'jessibuca-demuxer-flv-wasm.js',
    wasm: 'jessibuca-demuxer-flv.wasm',
    ffmpeg:
      'https://cdn.jsdelivr.net/npm/jessibuca@1.0.0-rc4.1/dist/ffmpeg/ffmpeg.js',
    ffmpegPath: 'ffmpeg.js',
    ffmpegWasm: 'ffmpeg.wasm',
    onPlay: function () {},
    onPause: function () {},
    onMute: function () {},
    onFullscreen: function () {},
    onResize: function () {},
    onBuffer: function () {},
    onStats: function () {},
    onRecord: function () {},
    onTimeUpdate: function () {},
    onVideoInfo: function () {},
    onAudioInfo: function () {},
    onPerformance: function () {},
    onError: function () {},
    onLoaded: function () {},
    onSuccess: function () {},
    onTimeout: function () {},
    onLoadingTimeout: function () {},
    onDelay: function () {},
    onQualityChange: function () {},
    onKeyFrame: function () {},
    onPTZ: function () {},
    onForbid: function () {},
  };
  function x(e) {
    if (!e) return null;
    var t = {};
    return (
      (t.info = e),
      e.pixelFmt === x.PIXEL_FMT.I420
        ? ((t.width = e.width), (t.height = e.height))
        : e.pixelFmt === x.PIXEL_FMT.YUV420P
        ? ((t.width = e.width),
          (t.height = e.height),
          (t.width_y = e.linesize_y),
          (t.height_y = e.height_y),
          (t.width_u = e.linesize_u),
          (t.height_u = e.height_u),
          (t.width_v = e.linesize_v),
          (t.height_v = e.height_v))
        : e.pixelFmt === x.PIXEL_FMT.RGB24BE
        ? ((t.width = e.width), (t.height = e.height))
        : e.pixelFmt === x.PIXEL_FMT.WASM_YUV420P
        ? ((t.width_y = e.width),
          (t.height_y = e.height),
          (t.width_u = e.width / 2),
          (t.height_u = e.height / 2),
          (t.width_v = e.width / 2),
          (t.height_v = e.height / 2))
        : e.pixelFmt === x.PIXEL_FMT.WASM_YUVJ420P
        ? ((t.width_y = e.width),
          (t.height_y = e.height),
          (t.width_u = e.width / 2),
          (t.height_u = e.height / 2),
          (t.width_v = e.width / 2),
          (t.height_v = e.height / 2))
        : e.pixelFmt === x.PIXEL_FMT.NV12
        ? ((t.width_y = e.width),
          (t.height_y = e.height),
          (t.width_uv = e.width / 2),
          (t_height_uv = e.height / 2))
        : e.pixelFmt === x.PIXEL_FMT.D3D11
        ? ((t.width_y = e.width),
          (t.height_y = e.height),
          (t.width_uv = e.width / 2),
          (t.height_uv = e.height / 2))
        : e.pixelFmt === x.PIXEL_FMT.VAAPI
        ? ((t.width = e.width), (t.height = e.height))
        : e.pixelFmt === x.PIXEL_FMT.VIDEOTOOLBOX
        ? ((t.width_y = e.width),
          (t.height_y = e.height),
          (t.width_uv = e.width / 2),
          (t.height_uv = e.height / 2))
        : e.pixelFmt === x.PIXEL_FMT.MEDIACODEC
        ? ((t.width_y = e.width),
          (t.height_y = e.height),
          (t.width_uv = e.width / 2),
          (t.height_uv = e.height / 2))
        : e.pixelFmt === x.PIXEL_FMT.CUDA
        ? ((t.width = e.width), (t.height = e.height))
        : e.pixelFmt === x.PIXEL_FMT.QSV
        ? ((t.width_y = e.width),
          (t.height_y = e.height),
          (t.width_uv = e.width / 2),
          (t.height_uv = e.height / 2))
        : e.pixelFmt === x.PIXEL_FMT.VDPAU &&
          ((t.width_y = e.width),
          (t.height_y = e.height),
          (t.width_uv = e.width / 2),
          (t.height_uv = e.height / 2)),
      (t.size = t.width_y * t.height_y + 2 * (t.width_u * t.height_u)),
      t
    );
  }
  (x.PIXEL_FMT = {
    YUV420P: 0,
    YUYV422: 1,
    UYVY422: 1,
    RGB24BE: 2,
    BGR24: 3,
    YUV422P: 4,
    YUV444P: 5,
    YUV410P: 6,
    YUV411P: 7,
    GRAY8: 8,
    MONOWHITE: 9,
    MONOBLACK: 10,
    PAL8: 11,
    YUVJ420P: 12,
    YUVJ422P: 13,
    YUVJ444P: 14,
    XVMC_MPEG2_MC: 15,
    XVMC_MPEG2_IDCT: 16,
    UYVY422_1: 17,
    UYYVYY411: 18,
    BAYER_BGGR8: 19,
    BAYER_RGGB8: 20,
    BAYER_GBRG8: 21,
    BAYER_GRBG8: 22,
    YUV440P: 23,
    YUVJ440P: 24,
    YUVA420P: 25,
    VDPAU_H264: 26,
    VDPAU_MPEG1: 27,
    VDPAU_MPEG2: 28,
    VDPAU_WMV3: 29,
    VDPAU_VC1: 30,
    RGB48BE: 31,
    RGB48LE: 32,
    RGB565BE: 33,
    RGB565LE: 34,
    RGB555BE: 35,
    RGB555LE: 36,
    BGR565BE: 37,
    BGR565LE: 38,
    BGR555BE: 39,
    BGR555LE: 40,
    VAAPI_MOCO: 41,
    VAAPI_IDCT: 42,
    VAAPI_VLD: 43,
    YUV420P16LE: 44,
    YUV420P16BE: 45,
    YUV422P16LE: 46,
    YUV422P16BE: 47,
    YUV444P16LE: 48,
    YUV444P16BE: 49,
    VDPAU_MPEG4: 50,
    DXVA2_VLD: 51,
    RGB444LE: 52,
    RGB444BE: 53,
    BGR444LE: 54,
    BGR444BE: 55,
    YA8: 56,
    BGR48BE: 57,
    BGR48LE: 58,
    YUV420P9BE: 59,
    YUV420P9LE: 60,
    YUV420P10BE: 61,
    YUV420P10LE: 62,
    YUV422P10BE: 63,
    YUV422P10LE: 64,
    YUV444P9BE: 65,
    YUV444P9LE: 66,
    YUV444P10BE: 67,
    YUV444P10LE: 68,
    YUV422P9BE: 69,
    YUV422P9LE: 70,
    GBRP: 71,
    GBRP9BE: 72,
    GBRP9LE: 73,
    GBRP10BE: 74,
    GBRP10LE: 75,
    GBRP16BE: 76,
    GBRP16LE: 77,
    YUVA422P: 78,
    YUVA444P: 79,
    YUVA420P9BE: 80,
    YUVA420P9LE: 81,
    YUVA422P9BE: 82,
    YUVA422P9LE: 83,
    YUVA444P9BE: 84,
    YUVA444P9LE: 85,
    YUVA420P10BE: 86,
    YUVA420P10LE: 87,
    YUVA422P10BE: 88,
    YUVA422P10LE: 89,
    YUVA444P10BE: 90,
    YUVA444P10LE: 91,
    YUVA420P16BE: 92,
    YUVA420P16LE: 93,
    YUVA422P16BE: 94,
    YUVA422P16LE: 95,
    YUVA444P16BE: 96,
    YUVA444P16LE: 97,
    VDPAU: 98,
    XYZ12LE: 99,
    XYZ12BE: 100,
    NV12: 101,
    NV21: 102,
    GRAY16BE: 103,
    GRAY16LE: 104,
    YUV440P10LE: 105,
    YUV440P10BE: 106,
    YUV440P12LE: 107,
    YUV440P12BE: 108,
    AYUV64LE: 109,
    AYUV64BE: 110,
    VIDEOTOOLBOX: 111,
    P010LE: 112,
    P010BE: 113,
    GBRAP: 114,
    GBRAP16BE: 115,
    GBRAP16LE: 116,
    D3D11VA_VLD: 117,
    CUDA: 118,
    I420: 1001,
    WASM_YUV420P: 2001,
    WASM_YUVJ420P: 2002,
    D3D11: 3001,
    VAAPI: 3002,
    QSV: 3003,
    MEDIACODEC: 3004,
    MMAL: 3005,
  }),
    (x.parseYUV = function (e, t) {
      if (!e) return null;
      var i = {},
        n = x.PIXEL_FMT,
        r = t === n.I420;
      return (
        t === n.YUV420P || r
          ? ((i.width = e.width),
            (i.height = e.height),
            (i.width_y = e.width),
            (i.height_y = e.height),
            (i.width_u = e.width / 2),
            (i.height_u = e.height / 2),
            (i.width_v = e.width / 2),
            (i.height_v = e.height / 2))
          : t === n.YUVJ420P
          ? ((i.width = e.width),
            (i.height = e.height),
            (i.width_y = e.width),
            (i.height_y = e.height),
            (i.width_u = e.width / 2),
            (i.height_u = e.height / 2),
            (i.width_v = e.width / 2),
            (i.height_v = e.height / 2))
          : t === n.WASM_YUV420P
          ? ((i.width_y = e.width),
            (i.height_y = e.height),
            (i.width_u = e.width / 2),
            (i.height_u = e.height / 2),
            (i.width_v = e.width / 2),
            (i.height_v = e.height / 2))
          : t === n.WASM_YUVJ420P
          ? ((i.width_y = e.width),
            (i.height_y = e.height),
            (i.width_u = e.width / 2),
            (i.height_u = e.height / 2),
            (i.width_v = e.width / 2),
            (i.height_v = e.height / 2))
          : t === n.YUYV422
          ? ((i.width_y = e.width),
            (i.height_y = e.height),
            (i.width_u = e.width / 2),
            (i.height_u = e.height),
            (i.width_v = e.width / 2),
            (i.height_v = e.height))
          : t === n.YUV422P
          ? ((i.width_y = e.width),
            (i.height_y = e.height),
            (i.width_u = e.width / 2),
            (i.height_u = e.height),
            (i.width_v = e.width / 2),
            (i.height_v = e.height))
          : t === n.YUVJ422P
          ? ((i.width_y = e.width),
            (i.height_y = e.height),
            (i.width_u = e.width / 2),
            (i.height_u = e.height),
            (i.width_v = e.width / 2),
            (i.height_v = e.height))
          : t === n.YUV444P
          ? ((i.width_y = e.width),
            (i.height_y = e.height),
            (i.width_u = e.width),
            (i.height_u = e.height),
            (i.width_v = e.width),
            (i.height_v = e.height))
          : t === n.YUVJ444P &&
            ((i.width_y = e.width),
            (i.height_y = e.height),
            (i.width_u = e.width),
            (i.height_u = e.height),
            (i.width_v = e.width),
            (i.height_v = e.height)),
        (i.size = i.width_y * i.height_y + 2 * (i.width_u * i.height_u)),
        i
      );
    });
  var P = (function (e) {
      function t() {
        var t;
        return (
          (t = e.call(this) || this),
          (t.TAG = 'Player'),
          (t.playing = !1),
          t.event = new w()),
          (t.close = function () {
            t.pause(), t.event.trigger('destroy');
          }),
          t
        );
      }
      return r(t, e), t;
    })(v),
    R = (function () {
      function e() {
        this.list = [];
      }
      var t = e.prototype;
      return (
        (t.shift = function () {
          return this.list.shift();
        }),
        (t.push = function (e) {
          this.list.push(e);
        }),
        i(e, [
          {
            key: 'length',
            get: function () {
              return this.list.length;
            },
          },
        ]),
        e
      );
    })(),
    C = (function (e) {
      function t(t, i) {
        var n;
        return ((n = e.call(this) || this).TAG = 'Decoder'), n;
      }
      return r(t, e), t;
    })(P),
    U = (function (e) {
      function t(t, i) {
        var n;
        return (n = e.call(this) || this).TAG = 'Render';
      }
      return r(t, e), t;
    })(P),
    L = 'undefined' == typeof Promise ? e.Promise : Promise,
    T = f(),
    D = T && /(edge|chrome|safari|firefox|msie)/i.test(navigator.userAgent),
    M =
      T &&
      /chrome/i.test(navigator.userAgent) &&
      /google/i.test(navigator.vendor),
    F =
      T &&
      /safari/i.test(navigator.userAgent) &&
      /apple/i.test(navigator.vendor),
    O = T && /firefox/i.test(navigator.userAgent),
    j = T && /msie/i.test(navigator.userAgent),
    I = T && /edge/i.test(navigator.userAgent),
    z = (T && /iPad|iPhone|iPod/.test(navigator.userAgent), T && !!navigator.platform) &&
      /iPad|iPhone|iPod/.test(navigator.platform),
    N = T && /android/i.test(navigator.userAgent),
    B = T && /trident/i.test(navigator.userAgent),
    W = T && 'standalone' in window.navigator && window.navigator.standalone,
    Y = T && ('ontouchstart' in window || navigator.maxTouchPoints),
    G = T && !!window.Promise,
    q = T && window.URL && window.URL.createObjectURL,
    H = T && !!window.Worker,
    J =
      T && 'undefined' != typeof WebAssembly && 'undefined' != typeof WebAssembly.compile,
    K =
      T &&
      ('undefined' != typeof OffscreenCanvas ||
        ('undefined' != typeof HTMLCanvasElement &&
          void 0 !== HTMLCanvasElement.prototype.transferControlToOffscreen)),
    V = (T && window.MediaSource) || window.ManagedMediaSource,
    $ = T && 'undefined' != typeof MediaStream,
    Z =
      T &&
      'undefined' != typeof RTCPeerConnection &&
      'undefined' != typeof RTCSessionDescription &&
      'undefined' != typeof RTCIceCandidate,
    Q =
      T &&
      (('undefined' != typeof WebGL2RenderingContext &&
        document.createElement('canvas').getContext('webgl2')) ||
        ('undefined' != typeof WebGLRenderingContext &&
          document.createElement('canvas').getContext('webgl'))),
    X =
      T &&
      (window.AudioContext ||
        window.webkitAudioContext ||
        window.mozAudioContext),
    ee = T && window.ScriptProcessorNode,
    te = T && window.AudioWorklet,
    ie = T && window.AudioWorkletNode,
    ne =
      !!te &&
      'undefined' != typeof AudioWorkletGlobalScope &&
      'undefined' != typeof AudioWorkletProcessor &&
      'undefined' != typeof registerProcessor,
    re = H && J && K,
    se = (function () {
      if ('undefined' == typeof window) return !1;
      var e = window,
        t = e.performance,
        i = e.document;
      if (t && i) {
        var n = i.createElement('video');
        return t.now() > 0 && n && n.canPlayType('video/mp4');
      }
      return !1;
    })(),
    oe = (function (e) {
      function t(t, i) {
        var n;
        return (
          ((n = e.call(this, t, i) || this).TAG = 'fetch'),
          (n.request = null),
          (n.reader = null),
          (n.contentLength = 0),
          (n.bytesReceived = 0),
          (n.isFetch = !1),
          n
        );
      }
      r(t, e);
      var i = t.prototype;
      return (
        (i.init = function () {
          var e = this,
            t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
            i = t.url,
            n = t.headers,
            r = void 0 === n ? {} : n;
          return fetch(i, { headers: r })
            .then(function (t) {
              e.contentLength = Number(t.headers.get('Content-Length'));
              var i = t.body;
              if (i) {
                var n = i.getReader();
                return n
                  .read()
                  .then(function r(t) {
                    var s = t.done,
                      o = t.value;
                    return s
                      ? (b(e.TAG, 'done!'), void (e.bytesReceived = 0))
                      : ((e.bytesReceived += o.byteLength),
                        e.event.trigger('data', o),
                        n.read().then(r));
                  })
                  .catch(function (t) {
                    b('err', t), (e.isFetch = !1), e.event.trigger('error', t);
                  });
              }
              t.blob().then(function (t) {
                b(e.TAG, 'fetch not support stream, fallback to blob');
                var i = new FileReader();
                i.readAsArrayBuffer(t),
                  (i.onload = function (t) {
                    var i = t.target.result;
                    e.event.trigger('data', i);
                  });
              });
            })
            .catch(function (t) {
              b('err', t), (e.isFetch = !1), e.event.trigger('error', t);
            });
        }),
        t
      );
    })(
      (function (e) {
        function t(t, i) {
          var n;
          return (
            ((n = e.call(this, t, i) || this).TAG = 'Source'),
            (n.player = t),
            (n.options = i),
            n
          );
        }
        return r(t, e), t;
      })(P)
    ),
    ae = (function (e) {
      function t(t, i) {
        var n;
        return (
          ((n = e.call(this, t, i) || this).TAG = 'Websocket'),
          (n.received = 0),
          (n.isWsing = !1),
          n
        );
      }
      r(t, e);
      var i = t.prototype;
      return (
        (i.init = function (e) {
          var t,
            i = this,
            n = void 0 === e ? {} : e;
          n.url, (t = n.protocols), (this.ws = new WebSocket(n.url, t));
          var r = this.options,
            s = r.heartbeat,
            o = r.heartbeatMsg;
          (this.isWsing = !0),
            (this.ws.binaryType = 'arraybuffer'),
            (this.ws.onmessage = function (e) {
              var t = e.data;
              (i.received += t.byteLength), i.event.trigger('data', t);
            }),
            (this.ws.onopen = function () {
              b(i.TAG, 'onopen'),
                i.event.trigger('open'),
                s &&
                  (i.heartbeatTimer = setInterval(function () {
                    i.ws.send(o);
                  }, 1e3 * s));
            }),
            (this.ws.onclose = function () {
              y(i.TAG, 'onclose'),
                (i.isWsing = !1),
                clearInterval(i.heartbeatTimer),
                i.event.trigger('close');
            }),
            (this.ws.onerror = function (e) {
              k(i.TAG, 'onerror', e),
                (i.isWsing = !1),
                i.event.trigger('error', e);
            });
        }),
        (i.send = function (e) {
          this.ws.send(e);
        }),
        (i.destroy = function () {
          this.ws && (this.ws.onmessage = this.ws.onopen = this.ws.onclose = this.ws.onerror = null),
            (this.ws = null);
        }),
        t
      );
    })(
      (function (e) {
        function t(t, i) {
          var n;
          return (
            ((n = e.call(this, t, i) || this).TAG = 'Source'),
            (n.player = t),
            (n.options = i),
            n
          );
        }
        return r(t, e), t;
      })(P)
    ),
    le = (function (e) {
      function t() {
        return e.apply(this, arguments) || this;
      }
      return r(t, e), t;
    })(P),
    ue = (function (e) {
      function t(t, i) {
        var n;
        return (
          ((n = e.call(this, t, i) || this).TAG = 'Demux'), (n.demuxer = null), n
        );
      }
      r(t, e);
      var n = t.prototype;
      return (
        (n.init = function (e) {
          var t = this,
            i = void 0 === e ? {} : e;
          if ((i.demuxType, i.demuxPath, this.options.useWCS && this.options.decoder)) {
            var n = this.options,
              r = n.decoder,
              s = n.wcsDomain,
              o = s;
            0 === r.indexOf('http')
              ? ((o = r.substring(0, r.lastIndexOf('/'))),
                (r = r.substring(r.lastIndexOf('/') + 1)))
              : 0 === r.indexOf('/') && (r = r.substring(1));
            var a = {
              url: i.url,
              onVideoFrame: function (e) {
                var i = e.data,
                  n = e.width,
                  r = e.height,
                  s = e.pixelFmt;
                t.event.trigger('video', {
                  data: i,
                  width: n,
                  height: r,
                  pixelFmt: s,
                });
              },
              onAudioFrame: function (e) {
                var i = e.data,
                  n = e.channels,
                  r = e.sampleRate;
                t.event.trigger('audio', { data: i, channels: n, sampleRate: r });
              },
              wcsDomain: o,
              decoderPath: r,
            };
            this.wcs = new WCS(a);
          } else {
            var l = this.options,
              u = l.demuxPath,
              c = l.demuxType,
              h = l.demuxIVF,
              d = l.demuxflv,
              f = l.demuxflvWasm,
              p = l.wasm;
            this.demuxer = new Worker(u);
            var g = {
              type: c,
              demuxIVF: h,
              demuxflv: d,
              demuxflvWasm: f,
              wasm: p,
              debug: this.options.debug,
            };
            this.demuxer.postMessage({ cmd: 'init', data: g }),
              (this.demuxer.onmessage = function (e) {
                var i = e.data,
                  n = i.cmd,
                  r = i.data;
                'video' === n
                  ? t.event.trigger('video', r)
                  : 'audio' === n
                  ? t.event.trigger('audio', r)
                  : 'av' === n
                  ? (t.event.trigger('video', r.video), t.event.trigger('audio', r.audio))
                  : 'loaded' === n
                  ? t.event.trigger('loaded')
                  : 'error' === n
                  ? t.event.trigger('error')
                  : 'keyframe' === n
                  ? t.event.trigger('keyframe', r)
                  : 'eof' === n && t.event.trigger('eof');
              });
          }
        }),
        (n.send = function (e) {
          this.demuxer.postMessage({ cmd: 'demux', data: e }, [e]);
        }),
        (n.destroy = function () {
          this.wcs && this.wcs.destroy(),
            this.demuxer && (this.demuxer.onmessage = null);
        }),
        t
      );
    })(le),
    ce = (function (e) {
      function t(t, i) {
        var n;
        return (n = e.call(this, t, i) || this).TAG = 'Decoder';
      }
      r(t, e);
      var i = t.prototype;
      return (
        (i.init = function (e) {
          var t = this,
            i = void 0 === e ? {} : e,
            n = i.codecId,
            r = this.options.decoder;
          if (H && r) {
            (this.decoder = new Worker(r)),
              (this.decoder.onmessage = function (e) {
                var i = e.data,
                  n = i.cmd,
                  r = i.data;
                'video' === n
                  ? t.event.trigger('video', r)
                  : 'error' === n
                  ? t.event.trigger('error')
                  : 'loaded' === n && t.event.trigger('loaded');
              });
            var s = { debug: this.options.debug, useOffscreen: this.options.useOffscreen };
            s.codecId = n,
              this.decoder.postMessage({ cmd: 'init', data: s });
          } else this.event.trigger('error');
        }),
        (i.send = function (e) {
          var t = e.data;
          this.decoder.postMessage({ cmd: 'decode', data: e }, [t.buffer]);
        }),
        (i.destroy = function () {
          this.decoder.onmessage = null;
        }),
        t
      );
    })(C),
    he = (function (e) {
      function t(t, i) {
        var n;
        return (n = e.call(this, t, i) || this).TAG = 'Audio';
      }
      r(t, e);
      var i = t.prototype;
      return (
        (i.init = function () {
          var e = this,
            t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
          if (
            ((this.audioCtx = new (window.AudioContext || window.webkitAudioContext)()),
            (this.gainNode = this.audioCtx.createGain()),
            this.gainNode.connect(this.audioCtx.destination),
            (this.startTime = this.audioCtx.currentTime),
            (this.options.isNotMute = this.options.isNotMute || !1),
            this.options.isNotMute
              ? (this.gainNode.gain.value = 1)
              : (this.gainNode.gain.value = 0),
            this.audioCtx.state,
            this.audioCtx.onstatechange,
            t)
          ) {
            var i = t.channels,
              n = t.sampleRate;
            (this.channels = i), (this.sampleRate = n);
          }
          this.audioCtx.resume().then(function () {
            e.event.trigger('resume');
          });
        }),
        (i.caculateSize = function (e) {
          for (var t = 0, i = 0; i < e.length; i++) t += e[i].length;
          return t;
        }),
        (i.concatData = function (e) {
          for (var t = this.caculateSize(e), i = new Float32Array(t), n = 0, r = 0; r < e.length; r++) {
            var s = e[r];
            i.set(s, n), (n += s.length);
          }
          return i;
        }),
        (i.play = function (e) {
          var t,
            i = e.channels,
            n = e.sampleRate,
            r = e.data;
          if (i !== this.channels || n !== this.sampleRate) {
            if (
              (b(this.TAG, 'audio info changed'),
              this.event.trigger('infoChange'),
              (this.channels = i),
              (this.sampleRate = n),
              (t = this.audioCtx).state,
              t.onstatechange,
              !this.options.isNotMute)
            )
              return;
          }
          var s = this.concatData(r),
            o = this.audioCtx.createBuffer(i, s.length / i, n),
            a = [];
          if (1 === i) a.push(s);
          else {
            for (var l = 0; l < i; l++) a.push(new Float32Array(s.length / i));
            for (var u = 0; u < s.length / i; u++)
              for (l = 0; l < i; l++) a[l][u] = s[i * u + l];
          }
          for (l = 0; l < i; l++) o.copyToChannel(a[l], l);
          var c = this.audioCtx.createBufferSource();
          (c.buffer = o),
            c.connect(this.gainNode),
            c.start(Math.max(this.startTime, this.audioCtx.currentTime)),
            (this.startTime = Math.max(this.startTime, this.audioCtx.currentTime) + o.duration);
        }),
        (i.mute = function () {
          var e = !(arguments.length > 0 && void 0 !== arguments[0]) || arguments[0];
          return e
            ? (this.gainNode.gain.value = 0)
            : (this.gainNode.gain.value = 1),
          this.event.trigger('mute', e),
          (this.isNotMute = !e),
          !e;
        }),
        (i.destroy = function () {
          var e;
          (e = this.audioCtx) &&
            ('running' === e.state && e.close(), (this.audioCtx = null));
        }),
        t
      );
    })(
      (function (e) {
        function t(t, i) {
          var n;
          return (n = e.call(this, t, i) || this).TAG = 'AudioPlayer';
        }
        return r(t, e), t;
      })(P)
    ),
    de = (function (e) {
      function t(t, i) {
        var n;
        return (n = e.call(this, t, i) || this).TAG = 'AudioWorklet';
      }
      r(t, e);
      var i = t.prototype;
      return (
        (i.init = function (e) {
          var t = this,
            i = void 0 === e ? {} : e;
          if (
            ((this.audioCtx = new (window.AudioContext || window.webkitAudioContext)()),
            (this.gainNode = this.audioCtx.createGain()),
            this.gainNode.connect(this.audioCtx.destination),
            (this.startTime = this.audioCtx.currentTime),
            (this.options.isNotMute = this.options.isNotMute || !1),
            this.options.isNotMute
              ? (this.gainNode.gain.value = 1)
              : (this.gainNode.gain.value = 0),
            this.audioCtx.state,
            this.audioCtx.onstatechange,
            i)
          ) {
            var n = i.channels,
              r = i.sampleRate;
            (this.channels = n), (this.sampleRate = r);
          }
          this.audioCtx.resume().then(function () {
            t.event.trigger('resume');
          });
        }),
        (i.createAudioWorklet = function (e, t) {
          var i = 'self.sampleRate = ' + t + ';';
          return (
            (i += 'self.channelCount = ' + e + ';'),
            new Blob(
              [
                i +
                  "class AudioWorkletProcessor extends AudioWorkletProcessor{constructor(e){super(e),this.buffer=new Float32Array(this.sampleRate*this.channelCount*1),this.posWrite=0,this.posRead=0,this.port.onmessage=e=>{let t=e.data.p_data;const i=t.length,s=this.buffer.length-this.posWrite;s>=i?this.buffer.set(t,this.posWrite):this.buffer.set(t.subarray(0,s),this.posWrite),this.buffer.set(t.subarray(s),0),this.posWrite=(this.posWrite+i)%this.buffer.length}}process(e,t){let i=t[0];const s=this.buffer.length;for(let e=0;e<i.length;e++){const t=i[e],o=t.length,a=(s+this.posWrite-this.posRead)%s;if(o>a)break;const l=(s-this.posRead);l>=o?t.set(this.buffer.subarray(this.posRead,this.posRead+o)):(t.set(this.buffer.subarray(this.posRead)),t.set(this.buffer.subarray(0,o-l),l)),this.posRead=(this.posRead+o)%s}return!0}};registerProcessor('audio-worklet-processor',AudioWorkletProcessor);",
              ],
              { type: 'application/javascript' }
            )
          );
        }),
        (i.caculateSize = function (e) {
          for (var t = 0, i = 0; i < e.length; i++) t += e[i].length;
          return t;
        }),
        (i.concatData = function (e) {
          for (var t = this.caculateSize(e), i = new Float32Array(t), n = 0, r = 0; r < e.length; r++) {
            var s = e[r];
            i.set(s, n), (n += s.length);
          }
          return i;
        }),
        (i.play = function (e) {
          var t,
            i = e.channels,
            n = e.sampleRate,
            r = e.data;
          if (i !== this.channels || n !== this.sampleRate) {
            if (
              (b(this.TAG, 'audio info changed'),
              this.event.trigger('infoChange'),
              (this.channels = i),
              (this.sampleRate = n),
              (t = this.audioCtx).state,
              t.onstatechange,
              !this.options.isNotMute)
            )
              return;
            var s = window.URL.createObjectURL(this.createAudioWorklet(i, n));
            this.audioCtx.audioWorklet.addModule(s).then(
              function () {
                var e = new AudioWorkletNode(
                  this.audioCtx,
                  'audio-worklet-processor'
                );
                e.connect(this.gainNode), (this.audioWorkletNode = e);
                var t = this.concatData(r);
                this.audioWorkletNode.port.postMessage({ p_data: t });
              }.bind(this)
            );
          }
          if (this.audioWorkletNode) {
            var o = this.concatData(r);
            this.audioWorkletNode.port.postMessage({ p_data: o });
          }
        }),
        (i.mute = function () {
          var e = !(arguments.length > 0 && void 0 !== arguments[0]) || arguments[0];
          return e
            ? (this.gainNode.gain.value = 0)
            : (this.gainNode.gain.value = 1),
          this.event.trigger('mute', e),
          (this.isNotMute = !e),
          !e;
        }),
        (i.destroy = function () {
          this.audioWorkletNode && this.audioWorkletNode.disconnect(),
            this.audioCtx && this.audioCtx.close();
        }),
        t
      );
    })(
      (function (e) {
        function t(t, i) {
          var n;
          return (n = e.call(this, t, i) || this).TAG = 'AudioPlayer';
        }
        return r(t, e), t;
      })(P)
    ),
    fe = (function (e) {
      function t(t, i) {
        var n;
        return (
          ((n = e.call(this, t, i) || this).TAG = 'WebGL'),
          (n.gl = null),
          (n.canvas = null),
          (n.yuvTexture = null),
          n
        );
      }
      r(t, e);
      var i = t.prototype;
      return (
        (i.init = function (e) {
          if ((void 0 === e && (e = {}), e.canvas)) this.canvas = e.canvas;
          else {
            if (!this.player.container) return !1;
            (this.canvas = document.createElement('canvas')),
              this.player.container.appendChild(this.canvas);
          }
          try {
            (this.gl = this.canvas.getContext('webgl', { preserveDrawingBuffer: !0 })),
              (this.gl.yuvTexture = this.initTexture(this.gl));
          } catch (e) {
            return this.event.trigger('error', e), !1;
          }
          return !0;
        }),
        (i.initTexture = function (e) {
          if (!e) return this.event.trigger('error'), null;
          var t = e.createShader(e.VERTEX_SHADER),
            i = e.createShader(e.FRAGMENT_SHADER);
          e.shaderSource(
            t,
            '\n                attribute vec4 a_position;\n                attribute vec2 a_texCoord;\n                varying vec2 v_texCoord;\n                void main(){\n                    gl_Position = a_position;\n                    v_texCoord = a_texCoord;\n                }\n            '
          ),
            e.shaderSource(
              i,
              '\n                precision highp float;\n                varying vec2 v_texCoord;\n                uniform sampler2D u_sampler_y;\n                uniform sampler2D u_sampler_u;\n                uniform sampler2D u_sampler_v;\n                const mat4 YUV2RGB = mat4(\n                    1.1643828125, 0, 1.59602734375, -0.87078515625,\n                    1.1643828125, -0.39176171875, -0.81296875, 0.52959375,\n                    1.1643828125, 2.017234375, 0, -1.081390625,\n                    0, 0, 0, 1\n                );\n                void main(){\n                    float y = texture2D(u_sampler_y, v_texCoord).r;\n                    float u = texture2D(u_sampler_u, v_texCoord).r;\n                    float v = texture2D(u_sampler_v, v_texCoord).r;\n                    gl_FragColor = vec4(y, u, v, 1) * YUV2RGB;\n                }\n            '
            ),
            e.compileShader(t),
            e.compileShader(i);
          var n = e.createProgram();
          e.attachShader(n, t),
            e.attachShader(n, i),
            e.linkProgram(n),
            e.useProgram(n),
            e.deleteShader(t),
            e.deleteShader(i);
          var r = e.getAttribLocation(n, 'a_position'),
            s = e.getAttribLocation(n, 'a_texCoord'),
            o = e.getUniformLocation(n, 'u_sampler_y'),
            a = e.getUniformLocation(n, 'u_sampler_u'),
            l = e.getUniformLocation(n, 'u_sampler_v'),
            u = e.createBuffer();
          return (
            e.bindBuffer(e.ARRAY_BUFFER, u),
            e.bufferData(
              e.ARRAY_BUFFER,
              new Float32Array([
                -1,
                1,
                0,
                0,
                1,
                1,
                1,
                0,
                -1,
                -1,
                0,
                1,
                1,
                -1,
                1,
                1,
              ]),
              e.STATIC_DRAW
            ),
            e.enableVertexAttribArray(r),
            e.vertexAttribPointer(r, 2, e.FLOAT, !1, 16, 0),
            e.enableVertexAttribArray(s),
            e.vertexAttribPointer(s, 2, e.FLOAT, !1, 16, 8),
            e.uniform1i(o, 0),
            e.uniform1i(a, 1),
            e.uniform1i(l, 2),
            {
              program: n,
              position: r,
              texCoord: s,
              sampler_y: o,
              sampler_u: a,
              sampler_v: l,
              buf: u,
              texture_y: this.createTexture(e, e.LUMINANCE),
              texture_u: this.createTexture(e, e.LUMINANCE),
              texture_v: this.createTexture(e, e.LUMINANCE),
            }
          );
        }),
        (i.createTexture = function (e, t) {
          var i = e.createTexture();
          return (
            e.bindTexture(e.TEXTURE_2D, i),
            e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MAG_FILTER, e.LINEAR),
            e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MIN_FILTER, e.LINEAR),
            e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_S, e.CLAMP_TO_EDGE),
            e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_T, e.CLAMP_TO_EDGE),
            e.bindTexture(e.TEXTURE_2D, null),
            i
          );
        }),
        (i.render = function (e) {
          var t = this.gl;
          if (t && e) {
            var i = t.canvas,
              n = this.options,
              r = (n.isResize, n.isFullResize, x(e)),
              s = r.width,
              o = r.height,
              a = r.info;
            a.pixelFmt;
            var l = e.data,
              u = (l.length, a.width),
              c = a.height;
            (i.width = s), (i.height = o), t.viewport(0, 0, s, o);
            var h = u * c,
              d = u / 2,
              f = c / 2,
              p = h,
              g = d * f,
              v = p + g,
              m = l.subarray(0, p),
              _ = l.subarray(p, v),
              w = l.subarray(v, l.length);
            t.activeTexture(t.TEXTURE0),
              t.bindTexture(t.TEXTURE_2D, this.gl.yuvTexture.texture_y),
              t.texImage2D(
                t.TEXTURE_2D,
                0,
                t.LUMINANCE,
                u,
                c,
                0,
                t.LUMINANCE,
                t.UNSIGNED_BYTE,
                m
              ),
              t.activeTexture(t.TEXTURE1),
              t.bindTexture(t.TEXTURE_2D, this.gl.yuvTexture.texture_u),
              t.texImage2D(
                t.TEXTURE_2D,
                0,
                t.LUMINANCE,
                d,
                f,
                0,
                t.LUMINANCE,
                t.UNSIGNED_BYTE,
                _
              ),
              t.activeTexture(t.TEXTURE2),
              t.bindTexture(t.TEXTURE_2D, this.gl.yuvTexture.texture_v),
              t.texImage2D(
                t.TEXTURE_2D,
                0,
                t.LUMINANCE,
                d,
                f,
                0,
                t.LUMINANCE,
                t.UNSIGNED_BYTE,
                w
              ),
              t.drawArrays(t.TRIANGLE_STRIP, 0, 4);
          }
        }),
        (i.destroy = function () {
          this.gl &&
            this.gl.yuvTexture &&
            (this.gl.deleteProgram(this.gl.yuvTexture.program),
            this.gl.deleteBuffer(this.gl.yuvTexture.buf),
            this.gl.deleteTexture(this.gl.yuvTexture.texture_y),
            this.gl.deleteTexture(this.gl.yuvTexture.texture_u),
            this.gl.deleteTexture(this.gl.yuvTexture.texture_v)),
            this.player.container &&
              this.canvas &&
              this.player.container.removeChild(this.canvas);
        }),
        t
      );
    })(U),
    pe = (function (e) {
      function t(t, i) {
        var n;
        return (n = e.call(this, t, i) || this).TAG = 'Canvas';
      }
      r(t, e);
      var i = t.prototype;
      return (
        (i.init = function (e) {
          var t;
          if (
            (void 0 === e && (e = {}),
            e.canvas
              ? (this.canvas = e.canvas)
              : ((this.canvas = document.createElement('canvas')),
                this.player.container.appendChild(this.canvas)),
            !this.options.forceNoOffscreen && K)
          )
            try {
              (this.offscreen = this.canvas.transferControlToOffscreen()),
                (this.renderWorker = new Worker(this.options.decoder)),
                (t = {
                  canvas: this.offscreen,
                  width: this.canvas.width,
                  height: this.canvas.height,
                  useOffscreen: !0,
                  debug: this.options.debug,
                });
            } catch (e) {
              return this.event.trigger('error', e), !1;
            }
          else
            (t = {
              canvas: this.canvas,
              width: this.canvas.width,
              height: this.canvas.height,
              useOffscreen: !1,
            }),
              (this.ctx = this.canvas.getContext('2d'));
          this.renderWorker.postMessage({ cmd: 'init', data: t }, [this.offscreen]);
        }),
        (i.render = function (e) {}),
        (i.destroy = function () {
          this.player.container &&
            this.canvas &&
            this.player.container.removeChild(this.canvas);
        }),
        t
      );
    })(U),
    ge = (function (e) {
      function t(t, i) {
        var n;
        return ((n = e.call(this, t, i) || this).TAG = 'Video'), n;
      }
      r(t, e);
      var n = t.prototype;
      return (
        (n.init = function (e) {
          var t;
          if (
            (void 0 === e && (e = {}),
            (this.video = document.createElement('video')),
            (this.video.style.width = '100%'),
            (this.video.style.height = '100%'),
            this.player.container.appendChild(this.video),
            (this.mediaSource = new MediaSource()),
            (this.url = URL.createObjectURL(this.mediaSource)),
            (this.video.src = this.url),
            this.options.isNotMute
              ? (this.video.muted = !1)
              : (this.video.muted = !0),
            (t = this.mediaSource).addEventListener(
              'sourceopen',
              this.onMediaSourceOpen.bind(this)
            ),
            t.addEventListener('sourceclose', this.onMediaSourceClose.bind(this)),
            t.addEventListener('webkitsourceopen', this.onMediaSourceOpen.bind(this)),
            t.addEventListener('webkitsourceclose', this.onMediaSourceClose.bind(this)),
            this.options.onPlay &&
              this.video.addEventListener('play', this.options.onPlay),
            this.options.onPause &&
              this.video.addEventListener('pause', this.options.onPause),
            this.options.onEnded &&
              this.video.addEventListener('ended', this.options.onEnded),
            this.options.onTimeUpdate)
          ) {
            var i = this.options.onTimeUpdate;
            this.video.addEventListener('timeupdate', function (e) {
              var t = e.target;
              i(t.currentTime, t.duration);
            });
          }
        }),
        (n.onMediaSourceOpen = function () {
          b(this.TAG, 'source open'),
            (this.sourceBuffer = this.mediaSource.addSourceBuffer(
              'video/mp4; codecs="avc1.64002A, mp4a.40.2"'
            )),
            this.mediaSource.duration,
            this.sourceBuffer.addEventListener(
              'updateend',
              this.onUpdateEnd.bind(this)
            ),
            this.sourceBuffer.addEventListener('error', this.onError.bind(this)),
            this.event.trigger('sourceOpen');
        }),
        (n.onMediaSourceClose = function () {
          b(this.TAG, 'source close');
        }),
        (n.onUpdateEnd = function () {
          this.event.trigger('updateEnd');
        }),
        (n.onError = function (e) {
          k(this.TAG, e);
        }),
        (n.play = function (e) {
          var t = this;
          this.video.paused &&
            this.video.play().catch(function (e) {
              t.event.trigger('canPlay', e);
            });
          try {
            this.sourceBuffer.appendBuffer(e);
          } catch (e) {
            this.event.trigger('error', e);
          }
        }),
        (n.pause = function () {
          var e;
          (e = this.video) && !e.paused && e.pause();
        }),
        (n.destroy = function () {
          this.player.container &&
            this.video &&
            this.player.container.removeChild(this.video);
        }),
        t
      );
    })(U),
    ve = (function (e) {
      function t(t, i) {
        var n;
        return (n = e.call(this, t, i) || this).TAG = 'Mux';
      }
      r(t, e);
      var i = t.prototype;
      return (
        (i.init = function (e) {
          var t = this,
            i = void 0 === e ? {} : e;
          if ((i.type, H)) {
            var n = this.options,
              r = n.muxFLV,
              s = n.muxMP4,
              o = n.muxHLS;
            if (this.options.recordType.toLocaleLowerCase() === 'mp4') {
              var a = this.options.recordTypeMp4UseFFmpeg,
                l = this.options.recordTypeMP4UseMux;
              a
                ? (this.muxer = new Worker(this.options.ffmpeg))
                : l && (this.muxer = new Worker(s));
            } else if ('flv' === this.options.recordType.toLocaleLowerCase()) {
              var u = this.options.recordTypeFlvUseFFmpeg,
                c = this.options.recordTypeFlvUseMux;
              u
                ? (this.muxer = new Worker(this.options.ffmpeg))
                : c && (this.muxer = new Worker(r));
            } else
              'hls' === this.options.recordType.toLocaleLowerCase() &&
                this.options.recordTypeHlsMux &&
                (this.muxer = new Worker(o));
            this.muxer &&
              (this.muxer.postMessage({ cmd: 'init', data: this.options }),
              (this.muxer.onmessage = function (e) {
                var i = e.data,
                  n = i.cmd,
                  r = i.data;
                'data' === n
                  ? t.event.trigger('data', r)
                  : 'error' === n && t.event.trigger('error');
              }));
          } else this.event.trigger('error');
        }),
        (i.send = function (e, t) {
          if ('video' === e) {
            var i = t.data;
            this.muxer && this.muxer.postMessage({ cmd: 'video', data: t }, [i.buffer]);
          } else if ('audio' === e) {
            var n = t.data;
            this.muxer && this.muxer.postMessage({ cmd: 'audio', data: t }, [n.buffer]);
          }
        }),
        (i.destroy = function () {
          this.muxer && (this.muxer.onmessage = null);
        }),
        t
      );
    })(
      (function (e) {
        function t(t, i) {
          var n;
          return (n = e.call(this, t, i) || this).TAG = 'Muxer';
        }
        return r(t, e), t;
      })(P)
    ),
    me = function (e) {
      this.data = e;
    };
  me.prototype = {
    read: function (e, t) {
      return this.data.subarray(e, e + t);
    },
  };
  var _e = function () {};
  (_e.prototype = {
    read: function (e, t) {
      if (this.stream) return this.stream.read(e, t);
    },
    seek: function (e, t) {
      if (this.stream) return this.stream.seek(e, t);
    },
    tell: function () {
      if (this.stream) return this.stream.tell();
    },
  }),
    String.fromCharCode;
  var we = function (e) {
      this.options = e;
    },
    be =
      ((we.prototype = {
        read: function (e) {
          var t = e.read(this.offset, this.length);
          return (this.offset += t.length), t;
        },
        load: function (e) {
          var t = this;
          'string' == typeof e
            ? new _e().load(e, function (e) {
                (t.stream = e), t.load(), t.options.oncomplete();
              })
            : ((this.stream = e), this.load());
        },
        loadFromFile: function (e) {
          var t = this;
          new ye().load(e, function (e) {
            (t.stream = e), t.load(), t.options.oncomplete();
          });
        },
        loadFromStream: function (e) {
          (this.stream = e), this.load(), this.options.oncomplete();
        },
        loadFromBuffer: function (e) {
          (this.stream = new me(e)), this.load(), this.options.oncomplete();
        },
      }),
      (function () {
        var e = function (e) {
            var t,
              i = e.read(4),
              n = String.fromCharCode.apply(String, i);
            if ('ftyp' != n) return !1;
            for (
              i = e.read(4), t = new DataView(i.buffer, i.byteOffset).getUint32(0), i = e.read(t - 8), e.offset += t - 8;
              e.offset < e.length;

            ) {
              var r = e.read(4);
              if (
                ((t = new DataView(r.buffer, r.byteOffset).getUint32(0)),
                'moov' == (n = String.fromCharCode.apply(String, e.read(4))))
              )
                return !0;
              e.offset += t - 8;
            }
            return !1;
          },
          t = function () {};
        return (t.prototype = new we()), (t.prototype.load = e), t;
      })()),
    ye = function () {};
  function ke() {}
  function Se(e, t, i, n) {
    (this.majorBrand = e),
      (this.minorVersion = t),
      (this.compatibleBrands = i),
      (this.flags = n);
  }
  function Ee(e, t) {
    (this.type = e), (this.flags = t);
  }
  function Ae(e) {
    (this.data = e),
      (this.readIdx = 0),
      (this.bitBuffer = 0),
      (this.bitLength = 0);
  }
  function xe(e, t) {
    (this.type = e), (this.flags = t);
  }
  function Pe(e, t, i, n, r) {
    (this.type = e),
      (this.flags = t),
      (this.creationTime = i),
      (this.modificationTime = n),
      (this.timescale = r);
  }
  function Re(e, t, i, n, r, s) {
    (this.type = e),
      (this.flags = t),
      (this.creationTime = i),
      (this.modificationTime = n),
      (this.trackId = r),
      (this.duration = s);
  }
  function Ce(e, t, i, n, r) {
    (this.type = e),
      (this.flags = t),
      (this.width = i),
      (this.height = n),
      (this.subType = r);
  }
  function Ue(e) {
    this.subType = e;
  }
  function Le(e, t, i, n, r, s, o) {
    (this.type = e),
      (this.flags = t),
      (this.dataReferenceIndex = i),
      (this.config = n),
      (this.channelCount = r),
      (this.sampleSize = s),
      (this.sampleRate = o);
  }
  function Te(e) {
    (this.subType = e), (this.config = e.config);
  }
  function De(e, t, i, n) {
    (this.type = e),
      (this.flags = t),
      (this.balance = i),
      (this.reserved = n);
  }
  function Me() {}
  function Fe(e, t, i) {
    (this.type = e), (this.flags = t), (this.data = i);
  }
  function Oe(e, t, i, n, r, s, o) {
    (this.type = e),
      (this.flags = t),
      (this.sampleCount = i),
      (this.sampleDelta = n),
      (this.sampleDuration = r),
      (this.sampleSize = s),
      (this.sampleFlags = o);
  }
  function je(e, t, i, n, r) {
    (this.type = e),
      (this.flags = t),
      (this.firstChunk = i),
      (this.samplesPerChunk = n),
      (this.sampleDescriptionIndex = r);
  }
  function Ie(e, t, i, n) {
    (this.type = e),
      (this.flags = t),
      (this.sampleSize = i),
      (this.sampleCount = n);
  }
  function ze(e, t, i, n) {
    (this.type = e),
      (this.flags = t),
      (this.sampleSize = i),
      (this.sampleSizes = n);
  }
  function Ne(e, t, i) {
    (this.type = e), (this.flags = t), (this.chunkOffsets = i);
  }
  function Be(e, t, i) {
    (this.type = e), (this.flags = t), (this.chunkOffsets = i);
  }
  function We(e, t, i) {
    (this.type = e), (this.flags = t), (this.sampleNumbers = i);
  }
  function Ye(e, t, i) {
    (this.type = e), (this.flags = t), (this.entries = i);
  }
  function Ge(e, t, i) {
    (this.type = e), (this.flags = t), (this.entries = i);
  }
  function qe(e, t, i) {
    (this.type = e), (this.flags = t), (this.data = i);
  }
  function He(e) {
    this.type = e;
  }
  function Je(e, t, i, n) {
    (this.type = e),
      (this.flags = t),
      (this.sampleDuration = i),
      (this.sampleCount = n);
  }
  function Ke(e, t, i, n) {
    (this.type = e),
      (this.flags = t),
      (this.trackId = i),
      (this.baseMediaDecodeTime = n);
  }
  function Ve(e, t, i, n, r, s) {
    (this.type = e),
      (this.flags = t),
      (this.trackId = i),
      (this.defaultSampleDescriptionIndex = n),
      (this.defaultSampleDuration = r),
      (this.defaultSampleSize = s),
      (this.defaultSampleFlags = 0);
  }
  function $e(e, t, i) {
    (this.type = e), (this.flags = t), (this.fragmentCount = i);
  }
  function Ze(e, t, i, n) {
    (this.type = e),
      (this.flags = t),
      (this.sequenceNumber = i),
      (this.trackId = n);
  }
  function Qe(e, t) {
    (this.type = e), (this.flags = t);
  }
  function Xe(e, t) {
    (this.type = e), (this.flags = t);
  }
  function et(e, t) {
    (this.type = e), (this.data = t);
  }
  function tt(e) {
    this.fields = e;
  }
  function it(e, t) {
    (this.type = e), (this.handlerType = t);
  }
  function nt(e, t, i) {
    (this.type = e), (this.flags = t), (this.entries = i);
  }
  (ye.prototype = {
    load: function (e, t) {
      var i = new FileReader();
      (i.onload = function (e) {
        t(new me(new Uint8Array(e.target.result)));
      }),
        i.readAsArrayBuffer(e);
    },
  }),
    (ke.prototype = {
      parse: function (e) {
        var t,
          i,
          n = e.read(4),
          r = String.fromCharCode.apply(null, n),
          s = e.read(4);
        i = new DataView(s.buffer, s.byteOffset).getUint32(0);
        var o = e.read(4);
        if ('ftyp' != String.fromCharCode.apply(null, o)) return null;
        for (
          this[r] = this.readFtyp(e, i),
            t = { offset: e.offset, length: i };
          e.offset < t.offset + t.length;

        );
        for (; e.offset < e.length; ) {
          var a = e.read(4);
          if (
            ((i = new DataView(a.buffer, a.byteOffset).getUint32(0)),
            (n = e.read(4)),
            (r = String.fromCharCode.apply(null, n)),
            'moov' == r)
          ) {
            this.readMoov(e, i);
            break;
          }
          if ('free' == r || 'mdat' == r) e.offset += i - 8;
          else if ('stco' != r) return null;
        }
      },
      readBox: function (e, t) {
        for (var i, n, r = {}; e.offset < t; ) {
          var s = e.read(4);
          if (
            ((n = new DataView(s.buffer, s.byteOffset).getUint32(0)),
            (i = String.fromCharCode.apply(null, e.read(4))),
            this['read' + i])
          ) {
            var o = this['read' + i](e, n);
            o && (r[o.type] = o);
          } else e.offset += n - 8;
        }
        return r;
      },
      readFtyp: function (e, t) {
        for (
          var i = e.read(4),
            n = String.fromCharCode.apply(null, i),
            r = new DataView(e.read(4).buffer).getUint32(0),
            s = [],
            o = t - 16,
            a = 0;
          a < o;
          a += 4
        )
          s.push(String.fromCharCode.apply(null, e.read(4)));
        return new Se(n, r, s);
      },
      readMoov: function (e, t) {
        (this.moov = this.readBox(e, e.offset + t - 8)),
          this.moov.mvhd.timescale,
          this.moov.mvhd.duration;
      },
      readMvhd: function (e, t) {
        var i = e.read(1),
          n = e.read(3),
          r = new DataView(e.read(4).buffer).getUint32(0),
          s = new DataView(e.read(4).buffer).getUint32(0),
          o = new DataView(e.read(4).buffer).getUint32(0),
          a = (new DataView(e.read(4).buffer).getUint32(0), e.read(t - 24));
        return new Pe(
          'mvhd',
          new Uint8Array(n),
          r,
          s,
          o,
          (function (e) {
            e.read(2), e.read(2);
            var t = new DataView(e.read(4).buffer).getInt32(0);
            e.read(4 * e.length);
            var i = new DataView(e.read(4).buffer).getInt32(0),
              n = new DataView(e.read(4).buffer).getInt32(0),
              r = new DataView(e.read(4).buffer).getInt32(0),
              s = new DataView(e.read(4).buffer).getInt32(0),
              o = new DataView(e.read(4).buffer).getInt32(0),
              a = new DataView(e.read(4).buffer).getInt32(0),
              l = new DataView(e.read(4).buffer).getInt32(0),
              u = new DataView(e.read(4).buffer).getInt32(0);
            e.read(24);
            var c = new DataView(e.read(4).buffer).getUint32(0);
            return {
              rate: t,
              matrix: [i, n, r, s, o, a, l, u],
              nextTrackId: c,
            };
          })(new me(a))
        );
      },
      readTrak: function (e, t) {
        return this.readBox(e, e.offset + t - 8);
      },
      readTkhd: function (e, t) {
        var i = e.read(1),
          n = e.read(3),
          r = new DataView(e.read(4).buffer).getUint32(0),
          s = new DataView(e.read(4).buffer).getUint32(0),
          o = new DataView(e.read(4).buffer).getUint32(0);
        e.read(4);
        var a = new DataView(e.read(4).buffer).getUint32(0);
        return (
          e.read(t - 32), new Re('tkhd', new Uint8Array(n), r, s, o, a)
        );
      },
      readMdia: function (e, t) {
        return this.readBox(e, e.offset + t - 8);
      },
      readMdhd: function (e, t) {
        return e.read(1), e.read(3), e.read(4), e.read(4), e.read(4), e.read(t - 20), null;
      },
      readHdlr: function (e, t) {
        e.read(1), e.read(3), e.read(4);
        var i = String.fromCharCode.apply(null, e.read(4));
        return (
          e.read(12),
          e.read(t - 32),
          new it('hdlr', 'dhlr' === this.type ? void 0 : i)
        );
      },
      readMinf: function (e, t) {
        return this.readBox(e, e.offset + t - 8);
      },
      readVmhd: function (e, t) {
        return e.read(1), e.read(3), e.read(t - 12), null;
      },
      readSmhd: function (e, t) {
        e.read(1), e.read(3), e.read(t - 12);
        var i = new DataView(e.read(2).buffer).getInt16(0);
        return e.read(2), new De('smhd', null, i, null);
      },
      readDinf: function (e, t) {
        return this.readBox(e, e.offset + t - 8);
      },
      readDref: function (e, t) {
        e.read(1), e.read(3);
        for (
          var i = new DataView(e.read(4).buffer).getUint32(0), n = [], r = 0;
          r < i;
          r++
        ) {
          var s = e.read(4);
          new DataView(s.buffer).getUint32(0), e.read(4), e.read(1), e.read(3);
        }
        return new nt('dref', null, n);
      },
      readStbl: function (e, t) {
        return this.readBox(e, e.offset + t - 8);
      },
      readStsd: function (e, t) {
        e.read(1), e.read(3);
        for (
          var i = new DataView(e.read(4).buffer).getUint32(0),
            n = {},
            r = 0;
          r < i;
          r++
        ) {
          var s = e.read(4),
            o = new DataView(s.buffer).getUint32(0),
            a = e.read(4),
            l = String.fromCharCode.apply(null, a),
            u = null;
          'avc1' == l
            ? (u = this.readAvc1(e, o))
            : 'mp4a' == l
            ? (u = this.readMp4a(e, o))
            : (e.offset += o - 8),
            u && (n[u.type] = u);
        }
        return n;
      },
      readAvc1: function (e, t) {
        e.read(6);
        var i = new DataView(e.read(2).buffer).getUint16(0);
        e.read(16);
        var n = new DataView(e.read(2).buffer).getUint16(0),
          r = new DataView(e.read(2).buffer).getUint16(0);
        e.read(4), e.read(32), e.read(2), e.read(2);
        var s = this.readBox(e, e.offset + t - 8 - 78);
        return new Ce('avc1', null, n, r, new Ue(s.avcC.data));
      },
      readAvcC: function (e) {
        var t = e.read(e.length - 8);
        return new Fe('avcC', null, t);
      },
      readMp4a: function (e, t) {
        e.read(6);
        var i = new DataView(e.read(2).buffer).getUint16(0);
        e.read(8);
        var n = new DataView(e.read(2).buffer).getUint16(0),
          r = new DataView(e.read(2).buffer).getUint16(0);
        e.read(4);
        var s = new DataView(e.read(2).buffer).getUint16(0),
          o = this.readEsds(e, t - 8 - 28);
        return new Le('mp4a', null, i, new Te(o), n, r, s);
      },
      readEsds: function (e, t) {
        e.read(1), e.read(3);
        for (var i = new Ae(e.read(t - 12)); 240 & i.read(4); );
        i.read(4),
          i.read(8),
          i.read(8),
          (function e(t) {
            for (
              var i,
                n,
                r,
                s,
                o,
                a = t.read(8),
                l = 0,
                u = new Array(4).fill(0),
                c = 0;
              c < 4;
              c++
            ) {
              if (128 & (i = t.read(8))) {
                if (((u[c] = 127 & i), (l += u[c]), c != u.length - 1))
                  continue;
              } else u[c] = i;
              (l += u[c]), (c = u.length - 1);
            }
            if (3 == a) {
              t.read(16);
              for (var h = 0; h < l - 2; ) e(t), (h = t.readIdx);
            } else if (4 == a) {
              t.read(8);
              var d = t.read(24),
                f = t.read(24);
              (r = t.read(32)),
                (s = t.read(32)),
                e(t),
                (n = { bufferSize: d, maxBitrate: s, avgBitrate: r });
            } else
              5 == a
                ? ((o = (function (e) {
                    var t,
                      i,
                      n,
                      r = e.read(5);
                    if (31 == r) r = 32 + e.read(6);
                    if (1 & (t = e.read(2)))
                      920 <= (i = e.read(4)) && (i = (e.read(12), e.read(1)));
                    else if (
                      ((i = e.read(4)),
                      15 == i && (i = e.read(24)),
                      (n = e.read(1)),
                      0 == i || 3 == i || 4 == i || 6 == i || 7 == i)
                    ) {
                      e.read(1), e.read(1), e.read(1);
                      var s = e.read(5);
                      e.read(1),
                        11 == s && (e.read(2), e.read(1), e.read(1));
                    }
                    return 1;
                  })(t)),
                  (n = n || {}))
                : t.read(8 * l);
          })(i);
      },
      readStts: function (e, t) {
        e.read(1), e.read(3);
        for (
          var i = new DataView(e.read(4).buffer).getUint32(0), n = [], r = 0;
          r < i;
          r++
        )
          n.push({
            sampleCount: new DataView(e.read(4).buffer).getUint32(0),
            sampleDelta: new DataView(e.read(4).buffer).getUint32(0),
          });
        return new Ye('stts', null, n);
      },
      readCtts: function (e, t) {
        e.read(1), e.read(3);
        for (
          var i = new DataView(e.read(4).buffer).getUint32(0), n = [], r = 0;
          r < i;
          r++
        )
          n.push({
            sampleCount: new DataView(e.read(4).buffer).getUint32(0),
            sampleDelta: new DataView(e.read(4).buffer).getUint32(0),
          });
        return new Ge('ctts', null, n);
      },
      readStss: function (e, t) {
        e.read(1), e.read(3);
        for (
          var i = new DataView(e.read(4).buffer).getUint32(0), n = [], r = 0;
          r < i;
          r++
        )
          n.push(new DataView(e.read(4).buffer).getUint32(0));
        return new We('stss', null, n);
      },
      readStsc: function (e, t) {
        e.read(1), e.read(3);
        for (
          var i = new DataView(e.read(4).buffer).getUint32(0), n = [], r = 0;
          r < i;
          r++
        )
          n.push(
            new je(
              'stsc',
              null,
              new DataView(e.read(4).buffer).getUint32(0),
              new DataView(e.read(4).buffer).getUint32(0),
              new DataView(e.read(4).buffer).getUint32(0)
            )
          );
        return n;
      },
      readStsz: function (e, t) {
        e.read(1), e.read(3);
        var i = new DataView(e.read(4).buffer).getUint32(0),
          n = new DataView(e.read(4).buffer).getUint32(0);
        if (0 != i) return new Ie('stsz', null, i, n);
        for (var r = [], s = 0; s < n; s++)
          r.push(new DataView(e.read(4).buffer).getUint32(0));
        return new ze('stsz', null, i, r);
      },
      readStco: function (e, t) {
        e.read(1), e.read(3);
        for (
          var i = new DataView(e.read(4).buffer).getUint32(0), n = [], r = 0;
          r < i;
          r++
        )
          n.push(new DataView(e.read(4).buffer).getUint32(0));
        return new Ne('stco', null, n);
      },
      readCo64: function (e, t) {
        e.read(1), e.read(3);
        for (
          var i = new DataView(e.read(4).buffer).getUint32(0), n = [], r = 0;
          r < i;
          r++
        ) {
          var s = new DataView(e.read(4).buffer).getUint32(0);
          n.push((s << 32) + new DataView(e.read(4).buffer).getUint32(0));
        }
        return new Be('co64', null, n);
      },
      readMfra: function (e, t) {
        return this.readBox(e, e.offset + t - 8);
      },
      readTfra: function (e, t) {
        e.read(1), e.read(3);
        for (
          var i = new DataView(e.read(4).buffer).getUint32(0),
            n = e.read(e.length - 13),
            r = new Ae(n),
            s = r.read(3),
            o = r.read(3),
            a = [],
            l = 0;
          l < s;
          l++
        )
          if (1 == o) {
            var u = (r.read(32) << 32) + r.read(32),
              c = (r.read(32) << 32) + r.read(32);
            r.read(i), r.read(i);
          } else {
            r.read(32), r.read(32), r.read(i), r.read(i);
          }
        return new qe('tfra', null, a);
      },
      readMfro: function (e, t) {
        e.read(1), e.read(3), e.read(4);
      },
      readMoof: function (e, t) {
        var i = this.readBox(e, e.offset + t - 8);
        return new He('moof', i);
      },
      readMfhd: function (e, t) {
        return (
          e.read(1),
          e.read(3),
          new $e(
            'mfhd',
            null,
            new DataView(e.read(4).buffer).getUint32(0)
          )
        );
      },
      readTraf: function (e, t) {
        return this.readBox(e, e.offset + t - 8);
      },
      readTfhd: function (e, t) {
        var i = e.read(1),
          n = e.read(3),
          r = new DataView(e.read(4).buffer).getUint32(0);
        return new Ve('tfhd', new Uint8Array(n), r);
      },
      readTrun: function (e, t) {
        e.read(1), e.read(3);
        var i = new DataView(e.read(4).buffer).getUint32(0);
        return e.read(4), e.read(t - 16), new Oe('trun', null, i);
      },
      readTfdt: function (e, t) {
        e.read(1), e.read(3);
        var i = new DataView(e.read(4).buffer).getUint32(0);
        return new Ke('tfdt', null, i);
      },
    }),
    (Se.prototype = new tt({
      type: 'ftyp',
      majorBrand: '',
      minorVersion: 0,
      compatibleBrands: [],
    })),
    (Ee.prototype = new tt({ type: 'box' })),
    (Ae.prototype = {
      read: function (e) {
        var t,
          i = 0;
        if (e > this.bitLength) {
          for (t = new Uint8Array((e - this.bitLength) / 8 + 1), n = 0; n < t.length; n++)
            t[n] = this.data[this.readIdx + n];
          for (
            this.readIdx += t.length,
              this.bitBuffer = (this.bitBuffer << (8 * t.length)) | this.decode(t),
              this.bitLength += 8 * t.length,
              n = 0;
            n < t.length;
            n++
          );
        }
        var n,
          r = this.bitBuffer,
          s = this.bitLength - e;
        return (
          (i = (i = r >>> s) & ((1 << e) - 1)),
          (this.bitLength -= e),
          (this.bitBuffer = i),
          i
        );
      },
      decode: function (e) {
        for (var t = 0, i = 0; i < e.length; ) (t = t << 8), (t |= e[i]), i++;
        return t;
      },
    }),
    (xe.prototype = new Ee()),
    (Pe.prototype = new xe()),
    (Re.prototype = new xe()),
    (Ce.prototype = new xe()),
    (Ue.prototype = new tt({ subType: 'avcC', type: 'avc1' })),
    (Le.prototype = new xe()),
    (Te.prototype = new tt({ subType: 'esds', type: 'mp4a' })),
    (De.prototype = new xe()),
    (Me.prototype = new tt({ type: 'dref' })),
    (Fe.prototype = new xe()),
    (Oe.prototype = new xe()),
    (je.prototype = new xe()),
    (Ie.prototype = new xe()),
    (ze.prototype = new xe()),
    (Ne.prototype = new xe()),
    (Be.prototype = new xe()),
    (We.prototype = new xe()),
    (Ye.prototype = new xe()),
    (Ge.prototype = new xe()),
    (qe.prototype = new xe()),
    (He.prototype = new tt()),
    (Je.prototype = new xe()),
    (Ke.prototype = new xe()),
    (Ve.prototype = new xe()),
    ($e.prototype = new xe()),
    (Ze.prototype = new tt({ type: 'box' })),
    (Qe.prototype = new tt({ type: 'box' })),
    (Xe.prototype = new tt({ type: 'box' })),
    (et.prototype = new tt({ type: 'box' })),
    (tt.prototype = {}),
    (it.prototype = new Ee()),
    (nt.prototype = new xe());
  var rt = (function () {
      function e() {}
      var t = e.prototype;
      return (
        (t.init = function (e) {
          if (!T) return !1;
          var t = new be(),
            i = new me(e);
          t.loadFromStream(i);
          for (var n = [], r = 0; r < t.stream.data.length; r++)
            n[r] = String.fromCharCode(t.stream.data[r]);
          for (
            var s = n.join(''),
              o = s.indexOf('ftyp'),
              a = s.indexOf('moov'),
              l = s.indexOf('mdat'),
              u =
                (s.indexOf('free'),
                new ke(),
                new Uint8Array(e.subarray(o, a + 4))),
              c = new Uint8Array(e.subarray(l, e.length)),
              h = 0;
            h < u.length;
            h++
          );
          var d = new Uint8Array(u.length + c.length);
          return d.set(u, 0), d.set(c, u.length), d.buffer;
        }),
        e
      );
    })(),
    st = function () {
      this.init.apply(this, arguments);
    };
  st.prototype = {
    init: function (e, t) {
      void 0 === t && (t = !1),
        (this.TAG = 'Buffer'),
        (this.options = e),
        (this.player = e),
        (this.type = 'Buffer'),
        (this.palying = !1),
        (this.isTimeout = !1),
        (this.isLoaded = !1),
        (this.isCompleted = !1),
        (this.audioCache = new R()),
        (this.videoCache = new R()),
        (this.event = new w()),
        (this.canplay = !1),
        t ||
          ((this.palying = !0),
          (this.timer = setInterval(this.update.bind(this), 100)));
    },
    feed: function (e) {
      if (
        (this.canplay || ((this.canplay = !0), this.event.trigger('canplay')),
        this.isTimeout && ((this.isTimeout = !1), this.clearTimeout()),
        e)
      ) {
        var t = e.video,
          i = e.audio;
        t && this.videoCache.push(t), i && this.audioCache.push(i);
      }
    },
    update: function () {
      if (this.palying) {
        if (!this.canplay)
          return this.isLoaded
            ? void 0
            : ((this.isTimeout = !0),
              void this.event.trigger('timeout', { reason: 'buffer' }));
        var e = this.options.videoBuffer,
          t = this.options.audioBuffer;
        if (
          this.videoCache.length > e ||
          this.audioCache.length > t ||
          this.isCompleted
        ) {
          if ((this.isLoaded || ((this.isLoaded = !0), this.event.trigger('load')), this.isTimeout)) {
            (this.isTimeout = !1), this.clearTimeout();
            var i = this.videoCache.length > e ? 'video' : 'audio';
            this.event.trigger('buffer', { reason: i });
          }
          this.updateFrame();
        } else
          this.isLoaded &&
            !this.isCompleted &&
            ((this.isTimeout = !0),
            this.event.trigger('timeout', { reason: 'buffer' }));
      }
    },
    updateFrame: function () {
      if (this.videoCache.length > 0) {
        var e = this.videoCache.shift();
        e && this.event.trigger('video', e);
      }
      if (this.audioCache.length > 0) {
        var t = this.audioCache.shift();
        t && this.event.trigger('audio', t);
      }
      this.isCompleted &&
        0 === this.videoCache.length &&
        0 === this.audioCache.length &&
        this.event.trigger('completed');
    },
    clearTimeout: function () {
      this.isLoaded && ((this.isTimeout = !1), this.event.trigger('clearTimeout'));
    },
    destroy: function () {
      (this.audioCache = null),
        (this.videoCache = null),
        clearInterval(this.timer),
        (this.timer = null),
        (this.event = null);
    },
  };
  var ot = {
      install: function () {
        var e = this;
        se
          ? (this.container = this.options.container)
          : k(this.TAG, 'the browser is not support playing video');
        var t = this.options,
          i = t.url,
          n = t.useWCS,
          r = t.useMSE,
          s = t.forceNoOffscreen;
        if (H) {
          if (n) this.demux = new ue(this, this.options);
          else if (/.mp4/i.test(i)) this.demux = new ue(this, this.options);
          else if (/.flv/i.test(i) || r)
            this.demux = new ue(this, this.options);
          else {
            if (!/.h264/i.test(i) && !/.h265/i.test(i) && !/.hevc/i.test(i))
              return void k(this.TAG, 'the video format is not support');
            this.demux = new ue(this, this.options);
          }
          this.buffer = new st(this.options);
        } else k(this.TAG, 'the browser is not support webworker');
        if (
          (H
            ? /.h264/i.test(i) || /.h265/i.test(i) || /.hevc/i.test(i)
              ? (this.decoder = new ce(this, this.options))
              : /wcs/i.test(i)
              ? y(this.TAG, 'WCS, not need decoder')
              : r && V
              ? (y(this.TAG, 'use MSE'), (this.render = new ge(this, this.options)))
              : y(this.TAG, 'not use MSE')
            : y(this.TAG, 'not use webworker'),
          !this.render)
        ) {
          if (Q)
            if (s);
            else if (re && this.options.useOffscreen) {
              b(this.TAG, 'use offscreen');
              var o = this.options,
                a = o.decoder,
                l = o.decoderPath,
                u = document.createElement('canvas');
              this.container.appendChild(u);
              try {
                var c = u.transferControlToOffscreen();
                (this.render = new Worker(a || l)),
                  this.render.postMessage(
                    { cmd: 'init', data: { canvas: c, useOffscreen: !0, debug: this.options.debug } },
                    [c]
                  );
              } catch (t) {
                k(this.TAG, 'transferControlToOffscreen error:', t),
                  this.options.useOffscreen,
                  (this.options.useOffscreen = !1),
                  (this.render = new fe(this, this.options));
              }
            } else
              b(this.TAG, 'use webgl'),
                (this.render = new fe(this, this.options));
          else
            b(this.TAG, 'use canvas'), (this.render = new pe(this, this.options));
          var h = this.render;
          h.event.on('error', function () {
            e.event.trigger('error', {
              err: 'render',
              msg: 'init render failed',
            });
          });
        }
        X && (this.audio = ne ? new de(this) : new he(this));
      },
      bindEvents: function () {
        var e = this,
          t = this.options,
          i = (t.videoBuffer, t.audioBuffer, t.onMute);
        this.source &&
          this.source.event.on('data', function (t) {
            e.demux.send(t);
          }),
          this.demux.event.on('loaded', function () {
            e.event.trigger('loaded');
          }),
          this.demux.event.on('video', function (t) {
            e.decoder
              ? e.decoder.send(t)
              : e.buffer.feed({
                  video: t,
                  audio: void 0,
                  info: {
                    pixelFmt: t.pixelFmt,
                    codecId: t.codecId,
                    width: t.width,
                    height: t.height,
                  },
                });
          }),
          this.demux.event.on('audio', function (t) {
            e.audio &&
              e.buffer.feed({
                video: void 0,
                audio: t,
                info: {
                  codecId: t.codecId,
                  sampleRate: t.sampleRate,
                  channels: t.channels,
                },
              });
          }),
          this.demux.event.on('keyframe', function (t) {
            var i;
            (i = e.options.onKeyFrame) && i(t);
          }),
          this.demux.event.on('error', function (t) {
            e.event.trigger('error', t);
          }),
          this.decoder &&
            this.decoder.event.on('video', function (t) {
              e.buffer.feed({ video: t });
            }),
          this.buffer.event.on('video', function (t) {
            var i;
            e.options.useWCS
              ? (i = x.parseYUV(t, t.pixelFmt))
              : ((i = x(t)), e.options.onVideoInfo && e.options.onVideoInfo(i.info)),
              e.render.render(t, i);
          }),
          this.buffer.event.on('audio', function (t) {
            var i;
            e.audio &&
              (e.options.onAudioInfo && e.options.onAudioInfo(t),
              (i = e.audio) && i.play(t));
          }),
          this.buffer.event.on('canplay', function () {
            b(e.TAG, 'canplay'), e.event.trigger('canplay');
          }),
          this.buffer.event.on('load', function () {
            b(e.TAG, 'load'), e.event.trigger('load');
          }),
          this.buffer.event.on('timeout', function (t) {
            e.event.trigger('timeout', t);
          }),
          this.buffer.event.on('clearTimeout', function () {
            e.event.trigger('clearTimeout');
          }),
          this.audio &&
            (this.audio.event.on('mute', function (e) {
              i && i(e);
            }),
            this.audio.event.on('infoChange', function () {
              e.buffer.audioCache = new R();
            })),
          this.render.event.on('canPlay', function () {
            var t;
            (t = e.video) && !t.paused && t.play();
          }),
          this.render.event.on('sourceOpen', function () {
            var t = new rt(),
              i = e.options.videoHeader,
              n = e.demux.event.on('video', function (r) {
                var s = t.init(r.data);
                e.render.play(s),
                  i && (e.render.play(i), (i = null)),
                  e.demux.event.off('video', n);
              }),
              r = e.demux.event.on('audio', function (t) {
                e.render.sourceBuffer.appendBuffer(t.data),
                  e.demux.event.off('audio', r);
              });
            e.render.event.on('updateEnd', function () {
              var t = e.demux.event.on('video', function (i) {
                  e.render.play(i.data), e.demux.event.off('video', t);
                }),
                i = e.demux.event.on('audio', function (t) {
                  e.render.play(t.data), e.demux.event.off('audio', i);
                });
            });
          }),
          this.event.on('destroy', function () {
            var t;
            b(e.TAG, 'destroy'),
              e.source && e.source.destroy(),
              e.demux && e.demux.destroy(),
              e.decoder && e.decoder.destroy(),
              e.render && e.render.destroy(),
              e.audio && e.audio.destroy(),
              e.buffer && e.buffer.destroy(),
              e.recorder && e.recorder.destroy(),
              e.context && ((t = e.context), t.destroy()),
              (e.palying = !1),
              (e.isFullResize = !1);
          });
      },
    },
    at = {
      init: function (e) {
        this.options = n({}, A, e);
        var t = this.options,
          i = t.container,
          r = t.video,
          s = t.audio;
        i && 'string' == typeof i && (this.options.container = document.getElementById(i)),
          r && 'string' == typeof r && (this.options.video = document.getElementById(r)),
          s && 'string' == typeof s && (this.options.audio = document.getElementById(s)),
          (this.TAG = 'Jessibuca'),
          (this.playing = !1),
          (this.version = '1.0.0-rc4'),
          (this.uid = _(Math.random)),
          (this.event = new w()),
          (this.on = this.event.on),
          (this.off = this.event.off),
          b(this.TAG, 'version:'.concat(this.version, ',uid:').concat(this.uid)),
          ot.install.call(this),
          ot.bindEvents.call(this);
      },
      play: function (e) {
        var t = this,
          i = e || this.options.url;
        if (!i) return k(this.TAG, 'url is null'), !1;
        this.options.url = i;
        var n = this.options.useWCS;
        if (
          ((this.playing = !0),
          (this.loadingTimer = setTimeout(function () {
            t.event.trigger('loadingTimeout');
          }, 1e3 * this.options.loadingTimeout)),
          this.source && this.source.destroy(),
          this.event.trigger('play'),
          n)
        )
          this.demux.init({ url: i });
        else {
          var r = {};
          if (
            (r.url = this.options.url,
            (r.protocols = this.options.protocols),
            r.url.startsWith('http') || r.url.startsWith('https'))
          ) {
            this.source = new oe(this, this.options);
            var s = this.options,
              o = s.headers;
            (o = void 0 === o ? {} : o), this.source.init({ url: r.url, headers: o });
          } else
            r.url.startsWith('ws') || r.url.startsWith('wss')
              ? ((this.source = new ae(this, this.options)),
                this.source.init(r))
              : k(this.TAG, 'url type is not support');
        }
        var a = this.options,
          l = a.demuxType,
          u = a.demuxPath,
          c = a.url;
        if (!l) {
          var h = c.split('?')[0];
          h.endsWith('.flv')
            ? (l = 'flv')
            : h.endsWith('.mp4') && (l = 'mp4');
        }
        this.demux.init({
          demuxType: l,
          demuxPath: u,
          url: this.options.url,
        }),
          this.render.init(),
          this.audio && this.audio.init();
        var d = this.event.on('load', function () {
            b(t.TAG, 'load'),
              t.event.off('load', d),
              clearTimeout(t.loadingTimer);
          }),
          f = this.event.on('canplay', function () {
            b(t.TAG, 'canplay'),
              t.event.off('canplay', f),
              clearTimeout(t.loadingTimer);
          });
      },
      pause: function () {
        this.playing &&
          (b(this.TAG, 'pause'),
          this.event.trigger('pause'),
          (this.playing = !1),
          this.buffer && (this.buffer.palying = !1));
      },
      destroy: function () {
        this.event.trigger('destroy'), this.event._events = {};
      },
      mute: function () {
        var e = !(arguments.length > 0 && void 0 !== arguments[0]) || arguments[0];
        return this.audio ? this.audio.mute(e) : this.options.isNotMute;
      },
      screenshot: function (e, t, i) {
        var n = this.render.canvas,
          r = document.createElement('canvas');
        (r.width = n.width), (r.height = n.height);
        var s = r.getContext('2d');
        s.drawImage(n, 0, 0, n.width, n.height);
        var o = e || 'jessibuca';
        (t = t || 'png'), (i = i || 'image/' + t);
        var a = r.toDataURL(i).split(';base64,')[1],
          l = window.atob(a),
          u = new Uint8Array(l.length);
        for (p = 0; p < l.length; p++) u[p] = l.charCodeAt(p);
        var c = new Blob([u], { type: i }),
          h = document.createElement('a');
        (h.href = URL.createObjectURL(c)),
          (h.download = o + '.' + t),
          h.click();
        for (var d = atob(a), f = new ArrayBuffer(d.length), p = 0; p < d.length; p++)
          f[p] = d.charCodeAt(p);
        return f;
      },
      fullscreen: function () {
        var e = !(arguments.length > 0 && void 0 !== arguments[0]) || arguments[0],
          t = this.container;
        if (e)
          if (t.requestFullscreen) t.requestFullscreen();
          else if (t.mozRequestFullScreen) t.mozRequestFullScreen();
          else if (t.webkitRequestFullscreen) t.webkitRequestFullscreen();
          else {
            if (!t.msRequestFullscreen)
              return void y(this.TAG, 'fullscreen is not support');
            t.msRequestFullscreen();
          }
        else
          document.exitFullscreen
            ? document.exitFullscreen()
            : document.mozCancelFullScreen
            ? document.mozCancelFullScreen()
            : document.webkitExitFullscreen && document.webkitExitFullscreen();
        return (this.isFullscreen = e), this.event.trigger('fullscreen', e), e;
      },
      resize: function () {
        var e = this.container.clientWidth,
          t = this.container.clientHeight;
        b(this.TAG, 'resize '.concat(e, ' ').concat(t)),
          (this.render.canvas.style.width = e + 'px'),
          (this.render.canvas.style.height = t + 'px'),
          this.event.trigger('resize');
      },
      setPerformance: function (e) {
        return (
          -1 !== ['auto', 'performance', 'fluent'].indexOf(e) &&
          ((this.options.performance = e), this.event.trigger('performance', e))
        );
      },
      setQuality: function (e) {
        if (-1 !== this.options.quality.indexOf(e))
          return (
            (this.options.qualityType = e),
            this.event.trigger('qualityChange', e),
            !0
          );
      },
      playAudio: function () {
        var e;
        (e = this.audio) && e.audioCtx && e.audioCtx.resume();
      },
    };
  var lt = (function (e) {
    function t(i) {
      var r;
      if (!T) return (r = e.call(this) || this), l(a(r));
      (at.init.call(a((r = e.call(this) || this)), i),
      n(a(r), at),
      r.options.isResize && window.addEventListener('resize', r.resize),
      r.options.hotKey) &&
        (document.addEventListener('keydown', function (e) {
          var t = e.keyCode,
            i = e.shiftKey,
            n = e.altKey;
          32 === t && r.playing && r.pause(),
            32 === t && !r.playing && r.play(),
            i && 70 === t && r.fullscreen(),
            i && 83 === t && r.screenshot(),
            n && 65 === t && r.mute(!r.audio.isNotMute),
            n &&
              81 === t &&
              (r.options.quality,
              -1 !== r.options.quality.indexOf(r.options.qualityType) &&
                (r.options.quality,
                r.setQuality(r.options.quality[(r.options.quality.indexOf(r.options.qualityType) + 1) % r.options.quality.length]))),
            n &&
              80 === t &&
              (r.options.performance,
              r.setPerformance(
                ['auto', 'performance', 'fluent'][
                  (['auto', 'performance', 'fluent'].indexOf(
                    r.options.performance
                  ) +
                    1) %
                    3
                ]
              ));
        }),
        r.event.on('destroy', function () {}));
      if (
        (r.options.supportDblclickFullscreen &&
          r.container.addEventListener('dblclick', function () {
            r.fullscreen(!r.isFullscreen);
          }),
        r.event.on('error', function (e) {
          k(r.TAG, e.err, e.msg), r.options.onError && r.options.onError(e);
        }),
        r.event.on('play', function () {
          b(r.TAG, 'play'), r.options.onPlay && r.options.onPlay();
        }),
        r.event.on('pause', function () {
          b(r.TAG, 'pause'), r.options.onPause && r.options.onPause();
        }),
        r.event.on('fullscreen', function (e) {
          b(r.TAG, 'fullscreen', e),
            r.options.onFullscreen && r.options.onFullscreen(e);
        }),
        r.event.on('resize', function () {
          b(r.TAG, 'resize'), r.options.onResize && r.options.onResize();
        }),
        r.event.on('performance', function (e) {
          var t = '';
          'auto' === e
            ? (t = '自动')
            : 'performance' === e
            ? (t = '性能')
            : 'fluent' === e && (t = '流畅'),
            b(r.TAG, 'performance', t),
            r.options.onPerformance && r.options.onPerformance(t);
        }),
        r.event.on('qualityChange', function (e) {
          b(r.TAG, 'qualityChange', e),
            r.options.onQualityChange && r.options.onQualityChange(e);
        }),
        r.event.on('stats', function (e) {
          r.options.onStats && r.options.onStats(e);
        }),
        r.event.on('success', function () {
          b(r.TAG, 'success'),
            r.options.onSuccess && r.options.onSuccess(),
            r.options.onLoaded && r.options.onLoaded();
        }),
        r.event.on('loaded', function () {
          b(r.TAG, 'loaded'), r.options.onLoaded && r.options.onLoaded();
        }),
        r.event.on('timeout', function (e) {
          k(r.TAG, 'timeout', e.reason),
            r.options.onTimeout && r.options.onTimeout();
        }),
        r.event.on('loadingTimeout', function (e) {
          k(r.TAG, 'loadingTimeout'),
            r.options.onLoadingTimeout && r.options.onLoadingTimeout();
        }),
        r.event.on('delay', function (e) {
          b(r.TAG, 'delay', e), r.options.onDelay && r.options.onDelay();
        }),
        r.event.on('forbid', function () {
          k(r.TAG, 'forbid'), r.options.onForbid && r.options.onForbid();
        }),
        r.options.url)
      ) {
        var s = r.options.autoplay,
          o = r.options.url;
        s && r.play(o);
      }
      return r;
    }
    r(t, e);
    var i = t.prototype;
    return (
      (i.on = function (t, i) {
        e.prototype.on.call(this, t, i);
      }),
      (i.off = function (t, i) {
        e.prototype.off.call(this, t, i);
      }),
      (i.destroy = function () {
        at.destroy.call(this);
      }),
      t
    );
  })(w);
  return (e.default = lt), e;
})({});
//# sourceMappingURL=jessibuca.js.map
