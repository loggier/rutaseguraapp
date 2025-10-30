
(function(global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
        typeof define === 'function' && define.amd ? define(factory) :
        (global = global || self, global.EasyPlayer = factory());
}(this, (function() {
    'use strict';
    var Default = {
        decodeType: "auto",
        videoUrl: "",
        poster: "",
        live: false,
        autoplay: false,
        "aspect-ratio": "16:9",
        fluent: true,
        showCustomButton: false,
        closeVideoClick: false,
        closeVideoDblclick: false,
        closeVideoTouch: false,
        bigPlayButton: true,
        bigPlayButtonCenter: true,
        playbackrate: false,
        playbackrateList: [1, 1.25, 1.5, 2],
        resolution: false,
        resolutiondefault: "auto",
        resolutionlist: [],
        protocol: "http:",
        get(name) {
            return this[name]
        },
        set(name, value) {
            return this[name] = value;
        }
    };
    var isMobile = !!navigator.userAgent.match(/AppleWebKit.*Mobile.*/);
    var Events = {
        PLAY: "play",
        PAUSE: "pause",
        ENDED: "ended",
        TIMEUPDATE: "timeupdate",
        SEEKING: "seeking",
        SEEKED: "seeked",
        ERROR: "error",
        RECONNECT: "reconnect",
        DESTROY: "destroy",
        RESIZE: "resize",
        FULLSCREEN: "fullscreen",
        FULLSCREEN_EXIT: "fullscreen_exit",
    }
    const PLAYER_STATE = {
        ready: "ready",
        playing: "playing",
        pause: "pause",
        ended: "ended",
        error: "error",
        destroy: "destroy"
    };
    var EasyPlayer = function(el, option) {
        if (!(this instanceof EasyPlayer)) {
            return new EasyPlayer(el, option);
        }
        EventEmitter.call(this);
        var self = this;
        this.version = "1.2.2_200424";
        this._container = "string" === typeof el ? document.getElementById(el) : el;
        this.option = option || {};
        for (var i in Default) {
            if ("undefined" == typeof this.option[i]) {
                this.option[i] = Default[i];
            }
        }
        if (this.option.protocol == "http:") {
            if (location.protocol == "https:") {
                this.option.protocol = "https:";
            }
        }
        this._container.setAttribute("data-easy-version", this.version);
        this.init();
    }
    EasyPlayer.prototype = new EventEmitter();
    EasyPlayer.prototype.init = function() {
        var _this = this;
        this.state = PLAYER_STATE.ready;
        this._container.classList.add("easy-player-container");
        this.decoder = null;
        if (!this.option.videoUrl) {
            console.log("videoUrl is empty");
            return;
        }
        if (this.option["aspect-ratio"]) {
            this._container.style.paddingTop = (1 / this.option["aspect-ratio"].split(":").reduce((p, c) => c / p) * 100) + "%";
        }
        this.createVideo();
        if (this.option.decodeType != "flv") {
            this.video.src = this.option.videoUrl;
        }
        this.createControl();
        if (this.option.autoplay) {
            setTimeout(() => {
                _this.play();
            }, 200)
        }
        this.bindEvents();
        window.addEventListener("resize", () => {
            _this.emit(Events.RESIZE)
        });
    };
    EasyPlayer.prototype.createVideo = function() {
        var _this = this;
        this.video = document.createElement("video");
        this.video.poster = this.option.poster;
        this.video.autoplay = false;
        this.video.setAttribute("playsinline", "");
        this.video.setAttribute("webkit-playsinline", "");
        this.video.setAttribute("x5-playsinline", "");
        this.video.setAttribute("x5-video-player-type", "h5");
        this.video.setAttribute("x5-video-player-fullscreen", "true");
        this.video.setAttribute("x5-video-orientation", "portraint");
        this.video.controls = false;
        this.video.className = "easy-player-video";
        this.video.addEventListener("contextmenu", e => {
            e.preventDefault();
        })
        this._container.appendChild(this.video);
        if (this.option.decodeType == "flv") {
            this.loadFlv();
        } else if (this.option.decodeType == "hls") {
            this.loadHls();
        }
    };
    EasyPlayer.prototype.loadHls = function() {
        var _this = this;
        if (window.Hls) {
            _this.loadHlsHandler();
        } else {
            var hlsScript = document.createElement("script");
            hlsScript.src = this.option.protocol + "//cdn.bootcdn.net/ajax/libs/hls.js/0.13.2/hls.min.js";
            _this._container.appendChild(hlsScript);
            hlsScript.onload = function() {
                _this.loadHlsHandler();
            }
        }
    }
    EasyPlayer.prototype.loadHlsHandler = function() {
        var _this = this;
        var Hls = window.Hls;
        if (Hls.isSupported()) {
            _this.decoder = new Hls();
            _this.decoder.loadSource(_this.option.videoUrl);
            _this.decoder.attachMedia(_this.video);
            _this.decoder.on(Hls.Events.MANIFEST_PARSED, function(e, data) {
                if (_this.option.autoplay) {
                    _this.video.play();
                }
            })
            _this.decoder.on(Hls.Events.ERROR, function(event, data) {
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            _this.decoder.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            _this.decoder.recoverMediaError();
                            break;
                        default:
                            _this.destroy();
                            break;
                    }
                }
            })
        }
    };
    EasyPlayer.prototype.loadFlv = function() {
        var _this = this;
        if (window.flvjs) {
            _this.loadFlvHandler();
        } else {
            var flvScript = document.createElement("script");
            flvScript.src = this.option.protocol + "//cdn.bootcdn.net/ajax/libs/flv.js/1.5.0/flv.min.js";
            _this._container.appendChild(flvScript);
            flvScript.onload = function() {
                _this.loadFlvHandler();
            }
        }
    };
    EasyPlayer.prototype.loadFlvHandler = function() {
        var _this = this;
        var flvjs = window.flvjs;
        if (flvjs.isSupported()) {
            _this.decoder = flvjs.createPlayer({
                type: 'flv',
                url: _this.option.videoUrl,
                isLive: _this.option.live,
            }, {
                enableStashBuffer: false,
                stashInitialSize: 128,
            });
            _this.decoder.attachMediaElement(_this.video);
            _this.decoder.load();
            if (_this.option.autoplay) {
                _this.decoder.play();
            }
            _this.decoder.on(flvjs.Events.ERROR, function(e, e2) {
                if (_this.option.live) {
                    _this.emit(Events.RECONNECT);
                    _this.decoder.unload();
                    _this.decoder.load();
                    _this.decoder.play();
                }
            })
        }
    };
    EasyPlayer.prototype.createControl = function() {
        this.control = document.createElement("div");
        this.control.className = "easy-player-control-bar";
        var controlHtml = `
            <div class="easy-player-progress-bar">
                <div class="easy-player-progress-played"></div>
                <div class="easy-player-progress-loaded"></div>
                <div class="easy-player-progress-tip">00:00</div>
                <div class="easy-player-progress-handle"></div>
            </div>
            <div class="easy-player-control-left">
                <div class="easy-player-control-button easy-player-play-button" data-state="pause">
                    <i class="icon-play"></i>
                    <i class="icon-pause"></i>
                </div>
                <div class="easy-player-control-button easy-player-volume-button" data-state="volume">
                    <i class="icon-volume"></i>
                    <i class="icon-volume-off"></i>
                </div>
                <div class="easy-player-volume-progress">
                    <div class="easy-player-volume-progress-played"></div>
                    <div class="easy-player-volume-progress-handle"></div>
                </div>
                <div class="easy-player-time">
                    <span class="easy-player-time-played">00:00</span>
                    /
                    <span class="easy-player-time-duration">00:00</span>
                </div>
            </div>
            <div class="easy-player-control-right">
                <div class="easy-player-resolution-button">
                    <span class="easy-player-resolution-text"></span>
                    <ul class="easy-player-resolution-list"></ul>
                </div>
                <div class.easy-player-playbackrate-button>
                    <span class="easy-player-playbackrate-text">1.0x</span>
                    <ul class="easy-player-playbackrate-list">
                    </ul>
                </div.easy-player-playbackrate-button>
                <div class="easy-player-control-button easy-player-fullscreen-button" data-state="fullscreen-exit">
                    <i class="icon-fullscreen-exit"></i>
                    <i class="icon-fullscreen"></i>
                </div>
            </div>
        `;
        this.control.innerHTML = controlHtml;
        this._container.appendChild(this.control);
        if (this.option.fluent) {
            this.control.querySelector(".easy-player-time").style.display = "none";
        }
        if (this.option.live) {
            this.control.querySelector(".easy-player-progress-bar").style.display = "none";
            this.control.querySelector(".easy-player-time").style.display = "none";
        }
        if (isMobile) {
            this.control.querySelector(".easy-player-volume-button").style.display = "none";
            this.control.querySelector(".easy-player-volume-progress").style.display = "none";
        }
        if (this.option.showCustomButton && this.option.customButton) {
            this.option.customButton.forEach(item => {
                var btn = document.createElement("div");
                btn.className = "easy-player-custom-button";
                btn.innerHTML = item.html;
                btn.addEventListener("click", () => {
                    item.action();
                })
                this.control.querySelector(".easy-player-control-right").prepend(btn)
            })
        }
        if (!this.option.resolution || this.option.resolutionlist.length == 0) {
            this.control.querySelector(".easy-player-resolution-button").style.display = "none";
        } else {
            this.control.querySelector(".easy-player-resolution-text").innerText = this.option.resolutiondefault == "auto" ? "自动" : this.option.resolutionlist.find(item => item.val == this.option.resolutiondefault).text;
            this.option.resolutionlist.forEach(item => {
                var li = document.createElement("li");
                li.innerText = item.text;
                li.setAttribute("data-val", item.val);
                this.control.querySelector(".easy-player-resolution-list").appendChild(li);
            })
        }
        if (!this.option.playbackrate) {
            this.control.querySelector(".easy-player-playbackrate-button").style.display = "none";
        } else {
            this.option.playbackrateList.forEach(item => {
                var li = document.createElement("li");
                li.innerText = item.toFixed(1) + "x";
                li.setAttribute("data-val", item);
                this.control.querySelector(".easy-player-playbackrate-list").appendChild(li);
            })
        }
        this.centerPlayBtn = document.createElement("div");
        this.centerPlayBtn.className = "easy-player-play-btn";
        this.centerPlayBtn.innerHTML = `<i class="icon-play"></i>`;
        this._container.appendChild(this.centerPlayBtn);
        if (!this.option.bigPlayButton || this.option.autoplay) {
            this.centerPlayBtn.style.display = "none";
        }
        if (!this.option.bigPlayButtonCenter) {
            this.centerPlayBtn.style.bottom = "40px";
            this.centerPlayBtn.style.left = "10px";
            this.centerPlayBtn.style.transform = "none";
        }
        this.loading = document.createElement("div");
        this.loading.className = "easy-player-loading";
        this.loading.innerHTML = `
        <div class="load-cir-1"></div>
        <div class="load-cir-2"></div>
        <div class="load-cir-3"></div>
        `
        this._container.appendChild(this.loading);
    };
    EasyPlayer.prototype.play = function() {
        var _this = this;
        var playPromise = this.video.play();
        if (playPromise !== undefined) {
            playPromise.then(function() {
                _this.video.played = true;
                _this.control.querySelector(".easy-player-play-button").setAttribute("data-state", "play");
                _this.centerPlayBtn.style.display = "none";
            }).catch(function(error) {
                console.log(error);
                _this.emit(Events.ERROR, {
                    errCode: 0,
                    errMsg: "The play() request was interrupted"
                });
            });
        }
    };
    EasyPlayer.prototype.pause = function() {
        this.video.pause();
        this.control.querySelector(".easy-player-play-button").setAttribute("data-state", "pause");
    };
    EasyPlayer.prototype.seek = function(time) {
        this.video.currentTime = time;
    };
    EasyPlayer.prototype.bindEvents = function() {
        var _this = this;
        var control = this.control;
        this.playBtn = control.querySelector(".easy-player-play-button");
        this.progressBar = control.querySelector(".easy-player-progress-bar");
        this.progressPlayed = control.querySelector(".easy-player-progress-played");
        this.progressLoaded = control.querySelector(".easy-player-progress-loaded");
        this.progressHandle = control.querySelector(".easy-player-progress-handle");
        this.progressTip = control.querySelector(".easy-player-progress-tip");
        this.volumeBtn = control.querySelector(".easy-player-volume-button");
        this.volumeBar = control.querySelector(".easy-player-volume-progress");
        this.volumePlayed = control.querySelector(".easy-player-volume-progress-played");
        this.volumeHandle = control.querySelector(".easy-player-volume-progress-handle");
        this.fullScreenBtn = control.querySelector(".easy-player-fullscreen-button");
        this.timePlayed = control.querySelector(".easy-player-time-played");
        this.timeDuration = control.querySelector(".easy-player-time-duration");
        this.resolutionBtn = control.querySelector(".easy-player-resolution-button");
        this.resolutionList = control.querySelector(".easy-player-resolution-list");
        this.playbackrateBtn = control.querySelector(".easy-player-playbackrate-button");
        this.playbackrateList = control.querySelector(".easy-player-playbackrate-list");
        this.playBtn.addEventListener("click", () => {
            var state = this.playBtn.getAttribute("data-state");
            if (state == "play") {
                this.pause();
            } else {
                this.play();
            }
        });
        if (this.option.closeVideoClick) {
            this.video.addEventListener("click", () => {
                var state = this.playBtn.getAttribute("data-state");
                if (state == "play") {
                    this.pause();
                } else {
                    this.play();
                }
            })
        }
        if (this.option.closeVideoDblclick) {
            this.video.addEventListener("dblclick", () => {
                var state = this.fullScreenBtn.getAttribute("data-state");
                if (state == "fullscreen") {
                    this.fullScreenExit();
                } else {
                    this.fullScreen();
                }
            })
        }
        var timer;
        var hideControl = () => {
            if (isMobile) {
                this.control.classList.remove("easy-player-control-show");
                this.centerPlayBtn.classList.remove("easy-player-play-btn-show");
            }
        }
        if (isMobile) {
            this.video.addEventListener("touchstart", () => {
                this.control.classList.toggle("easy-player-control-show");
                this.centerPlayBtn.classList.toggle("easy-player-play-btn-show");
                clearTimeout(timer);
                timer = setTimeout(hideControl, 5000);
            });
            this.control.addEventListener("touchstart", (e) => {
                clearTimeout(timer);
                e.stopPropagation();
            })
            this.control.addEventListener("touchend", (e) => {
                timer = setTimeout(hideControl, 5000);
                e.stopPropagation();
            })
            this.centerPlayBtn.addEventListener("touchend", (e) => {
                e.stopPropagation();
            })
        } else {
            this._container.addEventListener("mouseenter", () => {
                this.control.classList.add("easy-player-control-show");
            })
            this._container.addEventListener("mouseleave", () => {
                this.control.classList.remove("easy-player-control-show");
            })
        }
        this.centerPlayBtn.addEventListener("click", () => {
            this.play();
        })
        var onProgressHandle = (e) => {
            var pageX = e.pageX;
            if (isMobile) {
                pageX = e.touches[0].pageX;
            }
            var left = pageX - this.progressBar.getBoundingClientRect().left;
            if (left < 0) {
                left = 0;
            } else if (left > this.progressBar.clientWidth) {
                left = this.progressBar.clientWidth;
            }
            this.progressPlayed.style.width = left + "px";
            this.progressHandle.style.left = left - this.progressHandle.clientWidth / 2 + "px";
            this.seek(left / this.progressBar.clientWidth * this.video.duration);
        }
        var onProgressMouseup = (e) => {
            document.removeEventListener("mousemove", onProgressHandle);
            document.removeEventListener("mouseup", onProgressMouseup);
            document.removeEventListener("touchmove", onProgressHandle);
            document.removeEventListener("touchend", onProgressMouseup);
        }
        this.progressBar.addEventListener("mousedown", (e) => {
            onProgressHandle(e);
            document.addEventListener("mousemove", onProgressHandle);
            document.addEventListener("mouseup", onProgressMouseup);
        });
        this.progressBar.addEventListener("touchstart", (e) => {
            onProgressHandle(e);
            document.addEventListener("touchmove", onProgressHandle);
            document.addEventListener("touchend", onProgressMouseup);
        });
        this.progressBar.addEventListener("mousemove", (e) => {
            var pageX = e.pageX;
            if (isMobile) {
                pageX = e.touches[0].pageX;
            }
            var left = pageX - this.progressBar.getBoundingClientRect().left;
            var time = this.formatTime(left / this.progressBar.clientWidth * this.video.duration);
            this.progressTip.innerText = time;
            this.progressTip.style.left = left - this.progressTip.clientWidth / 2 + "px";
        })
        var onVolumeHandle = (e) => {
            var pageX = e.pageX;
            if (isMobile) {
                pageX = e.touches[0].pageX;
            }
            var left = pageX - this.volumeBar.getBoundingClientRect().left;
            if (left < 0) {
                left = 0;
            } else if (left > this.volumeBar.clientWidth) {
                left = this.volumeBar.clientWidth;
            }
            this.volumePlayed.style.width = left + "px";
            this.volumeHandle.style.left = left - this.volumeHandle.clientWidth / 2 + "px";
            this.video.volume = left / this.volumeBar.clientWidth;
        }
        var onVolumeMouseup = () => {
            document.removeEventListener("mousemove", onVolumeHandle);
            document.removeEventListener("mouseup", onVolumeMouseup);
        }
        this.volumeBar.addEventListener("mousedown", (e) => {
            onVolumeHandle(e);
            document.addEventListener("mousemove", onVolumeHandle);
            document.addEventListener("mouseup", onVolumeMouseup);
        })
        this.volumeBtn.addEventListener("click", () => {
            var state = this.volumeBtn.getAttribute("data-state");
            if (state == "volume") {
                this.video.muted = true;
                this.volumeBtn.setAttribute("data-state", "volume-off");
            } else {
                this.video.muted = false;
                this.volumeBtn.setAttribute("data-state", "volume");
            }
        })
        this.fullScreenBtn.addEventListener("click", () => {
            var state = this.fullScreenBtn.getAttribute("data-state");
            if (state == "fullscreen") {
                this.fullScreenExit();
            } else {
                this.fullScreen();
            }
        });
        if (this.option.resolution) {
            this.resolutionList.addEventListener("click", (e) => {
                var val = e.target.getAttribute("data-val");
                var text = e.target.innerText;
                this.changeResolution(val, text);
            })
        }
        if (this.option.playbackrate) {
            this.playbackrateList.addEventListener("click", (e) => {
                var val = e.target.getAttribute("data-val");
                var text = e.target.innerText;
                this.changePlaybackrate(val, text);
            })
        }
        this.video.addEventListener(Events.PLAY, () => {
            this.state = PLAYER_STATE.playing;
            this.emit(Events.PLAY);
            if (this.option.bigPlayButton) {
                this.centerPlayBtn.style.display = "none";
            }
        });
        this.video.addEventListener(Events.PAUSE, () => {
            this.state = PLAYER_STATE.pause;
            this.emit(Events.PAUSE);
            if (this.option.bigPlayButton) {
                this.centerPlayBtn.style.display = "block";
            }
        });
        this.video.addEventListener(Events.ENDED, () => {
            this.state = PLAYER_STATE.ended;
            this.emit(Events.ENDED);
        });
        this.video.addEventListener(Events.SEEKING, () => {
            this.emit(Events.SEEKING);
            this.loading.style.display = "block";
        })
        this.video.addEventListener(Events.SEEKED, () => {
            this.emit(Events.SEEKED);
            this.loading.style.display = "none";
        })
        this.video.addEventListener(Events.TIMEUPDATE, () => {
            this.emit(Events.TIMEUPDATE);
            if (!this.isDraging) {
                var playedPercent = this.video.currentTime / this.video.duration * 100;
                this.progressPlayed.style.width = playedPercent + "%";
                this.progressHandle.style.left = playedPercent + "%";
            }
            var loadedPercent = this.video.buffered.length > 0 ? this.video.buffered.end(this.video.buffered.length - 1) / this.video.duration * 100 : 0;
            this.progressLoaded.style.width = loadedPercent + "%";
            this.timePlayed.innerText = this.formatTime(this.video.currentTime);
            this.timeDuration.innerText = this.formatTime(this.video.duration);
        });
        this.video.addEventListener("waiting", () => {
            this.loading.style.display = "block";
        })
        this.video.addEventListener("playing", () => {
            this.loading.style.display = "none";
        })
        this.video.addEventListener("canplay", () => {
            this.loading.style.display = "none";
        })
        this.video.addEventListener(Events.ERROR, () => {
            this.state = PLAYER_STATE.error;
            this.emit(Events.ERROR);
            if (this.decoder) {
                this.decoder.destroy();
            }
        });
        document.addEventListener("fullscreenchange", () => {
            var isFullscreen = document.fullscreenElement;
            if (isFullscreen) {
                this.fullScreenBtn.setAttribute("data-state", "fullscreen");
                _this.emit(Events.FULLSCREEN);
            } else {
                this.fullScreenBtn.setAttribute("data-state", "fullscreen-exit");
                _this.emit(Events.FULLSCREEN_EXIT);
            }
        })
    };
    EasyPlayer.prototype.fullScreen = function() {
        if (this._container.requestFullscreen) {
            this._container.requestFullscreen();
        } else if (this._container.mozRequestFullScreen) {
            this._container.mozRequestFullScreen();
        } else if (this._container.webkitRequestFullscreen) {
            this._container.webkitRequestFullscreen();
        } else if (this.video.webkitEnterFullscreen) {
            this.video.webkitEnterFullscreen();
        }
    };
    EasyPlayer.prototype.fullScreenExit = function() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    };
    EasyPlayer.prototype.formatTime = function(time) {
        time = time >> 0;
        var hour = time / 3600 | 0;
        var minute = (time - hour * 3600) / 60 | 0;
        var second = time % 60;
        hour = hour > 0 ? (hour >= 10 ? hour : "0" + hour) + ":" : "";
        minute = (minute >= 10 ? minute : "0" + minute);
        second = (second >= 10 ? second : "0" + second);
        return hour + minute + ":" + second;
    };
    EasyPlayer.prototype.changeResolution = function(val, text) {
        var _this = this;
        var currentTime = _this.video.currentTime;
        var isPlay = _this.video.played;
        _this.resolutionBtn.querySelector(".easy-player-resolution-text").innerText = text;
        if (val == "auto") {
            _this.decoder.currentLevel = -1;
        } else {
            _this.decoder.levels.forEach((item, index) => {
                if (item.height == val) {
                    _this.decoder.currentLevel = index;
                }
            })
        }
        _this.video.currentTime = currentTime;
        if (isPlay) {
            _this.play();
        }
    };
    EasyPlayer.prototype.changePlaybackrate = function(val, text) {
        this.playbackrateBtn.querySelector(".easy-player-playbackrate-text").innerText = text;
        this.video.playbackRate = val;
    }
    EasyPlayer.prototype.destroy = function() {
        this.state = PLAYER_STATE.destroy;
        this.emit(Events.DESTROY);
        this.pause();
        this.video.src = "";
        this._container.innerHTML = "";
        if (this.decoder) {
            this.decoder.destroy();
        }
    };
    return EasyPlayer;
})));
//# sourceMappingURL=EasyPlayer.min.js.map

    