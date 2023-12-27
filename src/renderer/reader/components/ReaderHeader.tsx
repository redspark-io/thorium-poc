// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import * as debug_ from "debug";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { ReaderMode } from "readium-desktop/common/models/reader";
// import * as BackIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_back-24px-grey.svg";
import * as BackIcon from "readium-desktop/renderer/assets/icons/outline-exit_to_app-24px.svg";
import * as viewMode from "readium-desktop/renderer/assets/icons/aspect_ratio-black-18dp.svg";
import * as MuteIcon from "readium-desktop/renderer/assets/icons/baseline-mute-24px.svg";
import * as PauseIcon from "readium-desktop/renderer/assets/icons/baseline-pause-24px.svg";
import * as PlayIcon from "readium-desktop/renderer/assets/icons/baseline-play_arrow-24px.svg";
import * as SkipNext from "readium-desktop/renderer/assets/icons/baseline-skip_next-24px.svg";
import * as SkipPrevious from "readium-desktop/renderer/assets/icons/baseline-skip_previous-24px.svg";
import * as StopIcon from "readium-desktop/renderer/assets/icons/baseline-stop-24px.svg";
import * as AudioIcon from "readium-desktop/renderer/assets/icons/baseline-volume_up-24px.svg";
import * as SettingsIcon from "readium-desktop/renderer/assets/icons/font-size.svg";
import * as TOCIcon from "readium-desktop/renderer/assets/icons/open_book.svg";
import * as MarkIcon from "readium-desktop/renderer/assets/icons/outline-bookmark_border-24px.svg";
import * as DetachIcon from "readium-desktop/renderer/assets/icons/outline-flip_to_front-24px.svg";
import * as InfosIcon from "readium-desktop/renderer/assets/icons/outline-info-24px.svg";
import * as FullscreenIcon from "readium-desktop/renderer/assets/icons/sharp-crop_free-24px.svg";
import * as QuitFullscreenIcon from "readium-desktop/renderer/assets/icons/sharp-uncrop_free-24px.svg";
import * as stylesReader from "readium-desktop/renderer/assets/styles/reader-app.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import SVG from "readium-desktop/renderer/common/components/SVG";

import { fixedLayoutZoomPercent } from "@r2-navigator-js/electron/renderer/dom";
import {
    LocatorExtended, MediaOverlaysStateEnum, TTSStateEnum,
} from "@r2-navigator-js/electron/renderer/index";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";

import { IEventBusPdfPlayer, IPdfPlayerScale } from "../pdf/common/pdfReader.type";
import HeaderSearch from "./header/HeaderSearch";
import { IReaderMenuProps, IReaderOptionsProps } from "./options-values";
import ReaderMenu from "./ReaderMenu";
import ReaderOptions from "./ReaderOptions";
import {
    ensureKeyboardListenerIsInstalled, registerKeyboardListener, unregisterKeyboardListener,
} from "readium-desktop/renderer/common/keyboard";
import { DEBUG_KEYBOARD, keyboardShortcutsMatch } from "readium-desktop/common/keyboard";
import { connect } from "react-redux";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { TDispatch } from "readium-desktop/typings/redux";

const debug = debug_("readium-desktop:renderer:reader:components:ReaderHeader");

function throttle(callback: (...args: any) => void, limit: number) {
    let waiting = false;
    return function(this: any) {
        if (!waiting) {
            // eslint-disable-next-line prefer-rest-params
            callback.apply(this, arguments);
            waiting = true;
            setTimeout(() => {
                waiting = false;
            }, limit);
        }
    };
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
    menuOpen: boolean;
    infoOpen: boolean;
    shortcutEnable: boolean;
    mode?: ReaderMode;
    settingsOpen: boolean;
    handleMenuClick: () => void;
    handleSettingsClick: () => void;
    fullscreen: boolean;
    handleFullscreenClick: () => void;

    handleTTSPlay: () => void;
    handleTTSPause: () => void;
    handleTTSStop: () => void;
    handleTTSResume: () => void;
    handleTTSPrevious: (skipSentences?: boolean) => void;
    handleTTSNext: (skipSentences?: boolean) => void;
    handleTTSPlaybackRate: (speed: string) => void;
    handleTTSVoice: (voice: SpeechSynthesisVoice | null) => void;
    ttsState: TTSStateEnum;
    ttsPlaybackRate: string;
    ttsVoice: SpeechSynthesisVoice | null;

    publicationHasMediaOverlays: boolean;
    handleMediaOverlaysPlay: () => void;
    handleMediaOverlaysPause: () => void;
    handleMediaOverlaysStop: () => void;
    handleMediaOverlaysResume: () => void;
    handleMediaOverlaysPrevious: () => void;
    handleMediaOverlaysNext: () => void;
    handleMediaOverlaysPlaybackRate: (speed: string) => void;
    mediaOverlaysState: MediaOverlaysStateEnum;
    mediaOverlaysPlaybackRate: string;

    handleReaderClose: () => void;
    handleReaderDetach: () => void;
    toggleBookmark: () => void;
    isOnBookmark: boolean;
    isOnSearch: boolean;
    displayPublicationInfo: () => void;
    readerMenuProps: IReaderMenuProps;
    readerOptionsProps: IReaderOptionsProps;
    currentLocation: LocatorExtended;
    isDivina: boolean;
    isPdf: boolean;
    pdfEventBus: IEventBusPdfPlayer;
    divinaSoundPlay: (play: boolean) => void;
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps>, ReturnType<typeof mapDispatchToProps> {
    r2Publication: R2Publication;
}

interface IState {
    pdfScaleMode: IPdfPlayerScale | undefined;
    divinaSoundEnabled: boolean;
    fxlZoomPercent: number;
}

export class ReaderHeader extends React.Component<IProps, IState> {

    private enableFullscreenRef: React.RefObject<HTMLButtonElement>;
    private disableFullscreenRef: React.RefObject<HTMLButtonElement>;
    private settingsMenuButtonRef: React.RefObject<HTMLButtonElement>;
    private navigationMenuButtonRef: React.RefObject<HTMLButtonElement>;
    private infoMenuButtonRef: React.RefObject<HTMLButtonElement>;

    private onwheel: React.WheelEventHandler<HTMLButtonElement>;
    private timerFXLZoomDebounce: number | undefined;

    constructor(props: IProps) {
        super(props);
        this.enableFullscreenRef = React.createRef<HTMLButtonElement>();
        this.disableFullscreenRef = React.createRef<HTMLButtonElement>();
        this.settingsMenuButtonRef = React.createRef<HTMLButtonElement>();
        this.navigationMenuButtonRef = React.createRef<HTMLButtonElement>();
        this.infoMenuButtonRef = React.createRef<HTMLButtonElement>();

        this.focusSettingMenuButton = this.focusSettingMenuButton.bind(this);
        this.focusNaviguationMenuButton = this.focusNaviguationMenuButton.bind(this);

        this.onKeyboardFixedLayoutZoomReset = this.onKeyboardFixedLayoutZoomReset.bind(this);
        this.onKeyboardFixedLayoutZoomIn = this.onKeyboardFixedLayoutZoomIn.bind(this);
        this.onKeyboardFixedLayoutZoomOut = this.onKeyboardFixedLayoutZoomOut.bind(this);

        this.state = {
            pdfScaleMode: undefined,
            divinaSoundEnabled: false,
            fxlZoomPercent: 0,
        };

        this.timerFXLZoomDebounce = undefined;

        this.onwheel = throttle((ev) => {
            const step = 10;
            if (ev.deltaY < 0) { // "natural" gesture on MacOS :(
                if (this.state.fxlZoomPercent >= step) {
                    this.setState({ fxlZoomPercent: this.state.fxlZoomPercent - step });
                }
            } else if (ev.deltaY > 0) {
                if (this.state.fxlZoomPercent <= 390) {
                    this.setState({ fxlZoomPercent: this.state.fxlZoomPercent + step });
                }
            }
            if (this.timerFXLZoomDebounce) {
                clearTimeout(this.timerFXLZoomDebounce);
            }
            this.timerFXLZoomDebounce = window.setTimeout(() => {
                this.timerFXLZoomDebounce = undefined;
                fixedLayoutZoomPercent(this.state.fxlZoomPercent);
            }, 600);
        }, 200).bind(this);
    }

    public componentDidMount() {

        ensureKeyboardListenerIsInstalled();
        this.registerAllKeyboardListeners();

        this.props.pdfEventBus?.subscribe("scale", this.setScaleMode);
    }

    public componentWillUnmount() {

        this.unregisterAllKeyboardListeners();

        if (this.props.pdfEventBus) {
            this.props.pdfEventBus.remove(this.setScaleMode, "scale");
        }
    }

    public componentDidUpdate(oldProps: IProps, oldState: IState) {

        if (oldState.divinaSoundEnabled !== this.state.divinaSoundEnabled) {
            this.props.divinaSoundPlay(this.state.divinaSoundEnabled);
        }

        if (oldProps.pdfEventBus !== this.props.pdfEventBus) {

            this.props.pdfEventBus.subscribe("scale", this.setScaleMode);
        }

        if (this.props.fullscreen !== oldProps.fullscreen) {
            if (this.props.fullscreen && this.disableFullscreenRef?.current) {
                this.disableFullscreenRef.current.focus();
            } else if (!this.props.fullscreen && this.enableFullscreenRef?.current) {
                this.enableFullscreenRef.current.focus();
            }
        }

        if (this.props.infoOpen !== oldProps.infoOpen &&
            this.props.infoOpen === false &&
            this.infoMenuButtonRef?.current) {
            this.infoMenuButtonRef.current.focus();
        }

        if (this.props.menuOpen !== oldProps.menuOpen &&
            this.props.menuOpen === true) {
            this.focusNaviguationMenuButton();
        }

        if (this.props.settingsOpen !== oldProps.settingsOpen &&
            this.props.settingsOpen === true) {
            this.focusSettingMenuButton();
        }

        if (!keyboardShortcutsMatch(oldProps.keyboardShortcuts, this.props.keyboardShortcuts)) {
            console.log("READER HEADER RELOAD KEYBOARD SHORTCUTS");
            this.unregisterAllKeyboardListeners();
            this.registerAllKeyboardListeners();
        }
    }

    private registerAllKeyboardListeners() {
        registerKeyboardListener(
            true, // listen for key down (not key up)
            this.props.keyboardShortcuts.FXLZoomReset,
            this.onKeyboardFixedLayoutZoomReset);
        registerKeyboardListener(
            false, // listen for key down (not key up)
            this.props.keyboardShortcuts.FXLZoomIn,
            this.onKeyboardFixedLayoutZoomIn);
        registerKeyboardListener(
            false, // listen for key down (not key up)
            this.props.keyboardShortcuts.FXLZoomOut,
            this.onKeyboardFixedLayoutZoomOut);
    }

    private unregisterAllKeyboardListeners() {
        unregisterKeyboardListener(this.onKeyboardFixedLayoutZoomReset);
        unregisterKeyboardListener(this.onKeyboardFixedLayoutZoomIn);
        unregisterKeyboardListener(this.onKeyboardFixedLayoutZoomOut);
    }

    private onKeyboardFixedLayoutZoomReset() {
        if (!this.props.shortcutEnable) {
            if (DEBUG_KEYBOARD) {
                console.log("!shortcutEnable (onKeyboardFixedLayoutZoomReset)");
            }
            return;
        }
        this.setState({ fxlZoomPercent: 0 });
        fixedLayoutZoomPercent(0);
    }
    private onKeyboardFixedLayoutZoomIn() {
        if (!this.props.shortcutEnable) {
            if (DEBUG_KEYBOARD) {
                console.log("!shortcutEnable (onKeyboardFixedLayoutZoomIn)");
            }
            return;
        }
        const step = 10;
        let z = this.state.fxlZoomPercent === 0 ? 100 : (this.state.fxlZoomPercent + step);
        if (z >= 400) {
            z = 400;
        }

        this.setState({ fxlZoomPercent: z });

        if (this.timerFXLZoomDebounce) {
            clearTimeout(this.timerFXLZoomDebounce);
        }
        this.timerFXLZoomDebounce = window.setTimeout(() => {
            this.timerFXLZoomDebounce = undefined;
            fixedLayoutZoomPercent(z);
        }, 600);
    }
    private onKeyboardFixedLayoutZoomOut() {
        if (!this.props.shortcutEnable) {
            if (DEBUG_KEYBOARD) {
                console.log("!shortcutEnable (onKeyboardFixedLayoutZoomOut)");
            }
            return;
        }
        const step = -10;
        let z = this.state.fxlZoomPercent === 0 ? 100 : (this.state.fxlZoomPercent + step);
        if (z <= -step) {
            z = -step;
        }

        this.setState({ fxlZoomPercent: z });

        if (this.timerFXLZoomDebounce) {
            clearTimeout(this.timerFXLZoomDebounce);
        }
        this.timerFXLZoomDebounce = window.setTimeout(() => {
            this.timerFXLZoomDebounce = undefined;
            fixedLayoutZoomPercent(z);
        }, 600);
    }

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;

        const LANG_DIVIDER_PREFIX = "------------";
        let prevLang: string | undefined;
        // WARNING: .sort() is in-place same-array mutation! (not a new array)
        const _orderedVoices = speechSynthesis.getVoices().sort((a: SpeechSynthesisVoice, b: SpeechSynthesisVoice) => {
            if(a.lang < b.lang) { return -1; }
            if(a.lang > b.lang) { return 1; }
            // a.lang === b.lang ...
            if(a.name < b.name) { return -1; }
            if(a.name > b.name) { return 1; }
            return 0;
        }).reduce((acc, curr) => {
            if (!prevLang || prevLang !== curr.lang) {
                acc.push({
                    default: false,
                    lang: curr.lang,
                    localService: false,
                    name: LANG_DIVIDER_PREFIX,
                    voiceURI: "",
                });
            }
            prevLang = curr.lang;
            acc.push(curr);
            return acc;
        }, [] as SpeechSynthesisVoice[]);

        const showAudioTTSToolbar = (this.props.currentLocation && !this.props.currentLocation.audioPlaybackInfo) &&
            !this.props.isDivina && !this.props.isPdf;
        return (
            <nav
                className={classNames(stylesReader.main_navigation,
                    this.props.fullscreen ? stylesReader.main_navigation_fullscreen : undefined,
                    showAudioTTSToolbar || this.props.isDivina ? stylesReader.hasTtsAudio : undefined,
                    (this.props.publicationHasMediaOverlays &&
                        this.props.mediaOverlaysState !== MediaOverlaysStateEnum.STOPPED
                        || !this.props.publicationHasMediaOverlays &&
                        this.props.ttsState !== TTSStateEnum.STOPPED) ?
                        stylesReader.ttsAudioActivated : undefined,
                )}
                role="navigation"
                aria-label={__("accessibility.toolbar")}
            >
                <ul>

                    {(this.props.mode === ReaderMode.Attached) ? (
                        <li className={classNames(stylesReader.showInFullScreen)}>
                            <button
                                className={stylesReader.menu_button}
                                style={{transform:"rotate(-90deg)"}}
                                onClick={this.props.handleReaderClose}
                                title={__("reader.navigation.backHomeTitle")}
                            >
                                <SVG ariaHidden={true} svg={BackIcon} />
                            </button>
                        </li>
                    ) : (<></>)
                    }
                    <li>
                        <button
                            className={stylesReader.menu_button}
                            onClick={() => this.props.displayPublicationInfo()}
                            ref={this.infoMenuButtonRef}
                            title={__("reader.navigation.infoTitle")}
                        >
                            <SVG ariaHidden={true} svg={InfosIcon} />
                        </button>
                    </li>
                    {(this.props.mode === ReaderMode.Attached) ? (
                        <li>
                            <button
                                className={stylesReader.menu_button}
                                onClick={this.props.handleReaderDetach}
                                title={__("reader.navigation.detachWindowTitle")}
                            >
                                <SVG ariaHidden={true} svg={DetachIcon} />
                            </button>
                        </li>
                    ) : (<></>)
                    }

                    <ul className={classNames(stylesReader.tts_toolbar, stylesReader.showInFullScreen)}>
                        {
                            this.props.isDivina
                                ?
                                this.state.divinaSoundEnabled
                                ? <li className={stylesReader.button_audio}>
                                                <button
                                                    className={stylesReader.menu_button}
                                                    onClick={() => this.setState({divinaSoundEnabled: false})}
                                                    title={__("reader.divina.mute")}
                                                >
                                                    <SVG ariaHidden={true} svg={MuteIcon} />
                                                </button>
                                            </li>
                                : <li className={stylesReader.button_audio}>
                                                <button
                                                    className={stylesReader.menu_button}
                                                    onClick={() => this.setState({divinaSoundEnabled: true})}
                                                    title={__("reader.divina.unmute")}
                                                >
                                                    <SVG ariaHidden={true} svg={AudioIcon} />
                                                </button>
                                            </li>
                                : (this.props.publicationHasMediaOverlays &&
                                    this.props.mediaOverlaysState === MediaOverlaysStateEnum.STOPPED ||
                                    !this.props.publicationHasMediaOverlays &&
                                    this.props.ttsState === TTSStateEnum.STOPPED) ?
                                    <li className={stylesReader.button_audio}>
                                        <button
                                            className={stylesReader.menu_button}
                                            onClick={
                                                this.props.publicationHasMediaOverlays ?
                                                    this.props.handleMediaOverlaysPlay :
                                                    this.props.handleTTSPlay
                                            }
                                            title={
                                                this.props.publicationHasMediaOverlays ?
                                                    __("reader.media-overlays.activate") :
                                                    __("reader.tts.activate")
                                            }
                                        >
                                            <SVG ariaHidden={true} svg={AudioIcon} />
                                        </button>
                                    </li>
                                    : <>
                                        <li >
                                            <button
                                                className={stylesReader.menu_button}
                                                onClick={
                                                    this.props.publicationHasMediaOverlays ?
                                                        this.props.handleMediaOverlaysStop :
                                                        this.props.handleTTSStop
                                                }
                                                title={
                                                    this.props.publicationHasMediaOverlays ?
                                                        __("reader.media-overlays.stop") :
                                                        __("reader.tts.stop")
                                                }
                                            >
                                                <SVG ariaHidden={true} svg={StopIcon} />
                                            </button>
                                        </li>
                                        <li >
                                            <button
                                                className={stylesReader.menu_button}
                                                onClick={(e) => {
                                                    if (this.props.publicationHasMediaOverlays) {
                                                        this.props.handleMediaOverlaysPrevious();
                                                    } else {
                                                        this.props.handleTTSPrevious(e.shiftKey && e.altKey);
                                                    }
                                                }}
                                                title={
                                                    this.props.publicationHasMediaOverlays ?
                                                        __("reader.media-overlays.previous") :
                                                        __("reader.tts.previous")
                                                }
                                            >
                                                <SVG ariaHidden={true} svg={SkipPrevious} />
                                            </button>
                                        </li>
                                        {(this.props.publicationHasMediaOverlays &&
                                            this.props.mediaOverlaysState === MediaOverlaysStateEnum.PLAYING ||
                                            !this.props.publicationHasMediaOverlays &&
                                            this.props.ttsState === TTSStateEnum.PLAYING) ?
                                            <li >
                                                <button
                                                    className={stylesReader.menu_button}
                                                    onClick={
                                                        this.props.publicationHasMediaOverlays ?
                                                            this.props.handleMediaOverlaysPause :
                                                            this.props.handleTTSPause
                                                    }
                                                    title={
                                                        this.props.publicationHasMediaOverlays ?
                                                            __("reader.media-overlays.pause") :
                                                            __("reader.tts.pause")
                                                    }
                                                >
                                                    <SVG ariaHidden={true} svg={PauseIcon} />
                                                </button>
                                            </li>
                                            :
                                            <li >
                                                <button
                                                    className={stylesReader.menu_button}
                                                    onClick={
                                                        this.props.publicationHasMediaOverlays ?
                                                            this.props.handleMediaOverlaysResume :
                                                            this.props.handleTTSResume
                                                    }
                                                    title={
                                                        this.props.publicationHasMediaOverlays ?
                                                            __("reader.media-overlays.play") :
                                                            __("reader.tts.play")
                                                    }
                                                >
                                                    <SVG ariaHidden={true} svg={PlayIcon} />
                                                </button>
                                            </li>
                                        }
                                        <li >
                                            <button
                                                className={stylesReader.menu_button}

                                                onClick={(e) => {
                                                    if (this.props.publicationHasMediaOverlays) {
                                                        this.props.handleMediaOverlaysNext();
                                                    } else {
                                                        this.props.handleTTSNext(e.shiftKey && e.altKey);
                                                    }
                                                }}
                                                title={
                                                    this.props.publicationHasMediaOverlays ?
                                                        __("reader.media-overlays.next") :
                                                        __("reader.tts.next")
                                                }
                                            >
                                                <SVG ariaHidden={true} svg={SkipNext} />
                                            </button>
                                        </li>
                                        <li className={stylesReader.ttsSelectRate}>
                                            <select title={
                                                this.props.publicationHasMediaOverlays ?
                                                    __("reader.media-overlays.speed") :
                                                    __("reader.tts.speed")
                                            }
                                                onChange={(ev) => {
                                                    if (this.props.publicationHasMediaOverlays) {
                                                        this.props.handleMediaOverlaysPlaybackRate(
                                                            ev.target.value.toString(),
                                                        );
                                                    } else {
                                                        this.props.handleTTSPlaybackRate(
                                                            ev.target.value.toString(),
                                                        );
                                                    }
                                                }}
                                                value={
                                                    this.props.publicationHasMediaOverlays ?
                                                        this.props.mediaOverlaysPlaybackRate :
                                                        this.props.ttsPlaybackRate
                                                }
                                            >
                                                <option value="3">3x</option>
                                                <option value="2.75">2.75x</option>
                                                <option value="2.5">2.5x</option>
                                                <option value="2.25">2.25x</option>
                                                <option value="2">2x</option>
                                                <option value="1.75">1.75x</option>
                                                <option value="1.5">1.5x</option>
                                                <option value="1.25">1.25x</option>
                                                <option value="1">1x</option>
                                                <option value="0.75">0.75x</option>
                                                <option value="0.5">0.5x</option>
                                            </select>
                                        </li>
                                        {!this.props.publicationHasMediaOverlays && (
                                            <li className={stylesReader.ttsSelectVoice}>
                                                <select title={__("reader.tts.voice")}
                                                    onChange={(ev) => {
                                                        const i = parseInt(ev.target.value.toString(), 10);
                                                        let voice = i === 0 ? null : _orderedVoices[i - 1];
                                                        // alert(`${i} ${voice.name} ${voice.lang} ${voice.default} ${voice.voiceURI} ${voice.localService}`);
                                                        if (voice && voice.name === LANG_DIVIDER_PREFIX) {
                                                            // voice = null;
                                                            voice = _orderedVoices[i];
                                                        }
                                                        this.props.handleTTSVoice(voice ? voice : null);
                                                    }}
                                                    value={
                                                        this.props.ttsVoice ?
                                                            _orderedVoices.findIndex((voice) => {
                                                                // exact match
                                                                return voice.name === this.props.ttsVoice.name && voice.lang === this.props.ttsVoice.lang && voice.voiceURI === this.props.ttsVoice.voiceURI && voice.default === this.props.ttsVoice.default && voice.localService === this.props.ttsVoice.localService;
                                                            }) + 1 : 0
                                                    }
                                                >
                                                    {
                                                        [].concat((<option key={"tts0"} value="{i}">{`${__("reader.tts.default")}`}</option>),
                                                            _orderedVoices.map((voice, i) => {
                                                                // SpeechSynthesisVoice
                                                                return (<option key={`tts${i + 1}`} value={i + 1}>{`${voice.name}${voice.name === LANG_DIVIDER_PREFIX ? ` [${voice.lang}]` : ""}${voice.default ? " *" : ""}`}</option>);
                                                            }))
                                                    }
                                                </select>
                                            </li>
                                        )}
                                    </>
                        }
                    </ul>
                    <ul className={stylesReader.menu_option}>
                        {
                            this.props.isPdf
                                ? <li
                                    {...(this.state.pdfScaleMode === "page-width" &&
                                        { style: { backgroundColor: "rgb(193, 193, 193)" } })}
                                >
                                    <input
                                        id="pdfScaleButton"
                                        className={stylesReader.bookmarkButton}
                                        type="checkbox"
                                        checked={this.state.pdfScaleMode === "page-width"}
                                        // tslint:disable-next-line: max-line-length
                                        onChange={() => this.props.pdfEventBus.dispatch("scale", this.state.pdfScaleMode === "page-fit" ? "page-width" : "page-fit")}
                                        aria-label={__("reader.navigation.pdfscalemode")}
                                    />
                                    <label
                                        htmlFor="pdfScaleButton"
                                        className={stylesReader.menu_button}
                                    >
                                        <SVG svg={viewMode} title={__("reader.navigation.pdfscalemode")} />
                                    </label>
                                </li>
                                : (this.props.r2Publication.Metadata?.Rendition?.Layout === "fixed"
                                    ? <li
                                        {...(this.state.fxlZoomPercent !== 0 &&
                                            { style: { backgroundColor: "rgb(193, 193, 193)" } })}
                                    >
                                        <label
                                            htmlFor="buttonFXLZoom"
                                            style={{ pointerEvents: "none", position: "absolute", paddingLeft: "12px", paddingTop: "4px", fontSize: "80%", color: "#333333" }}>{this.state.fxlZoomPercent > 0 ? `${this.state.fxlZoomPercent}%` : " "}</label>
                                        <button
                                            id="buttonFXLZoom"
                                            className={classNames(stylesReader.menu_button)}
                                            onWheel={this.onwheel}
                                            onClick={() => {
                                                // toggle
                                                debug("FXL this.state.fxlZoomPercent TOGGLE: " + this.state.fxlZoomPercent);
                                                if (this.state.fxlZoomPercent === 0) {
                                                    this.setState({ fxlZoomPercent: 200 });
                                                    fixedLayoutZoomPercent(200); // twice (zoom in)
                                                } else if (this.state.fxlZoomPercent === 200) {
                                                    this.setState({ fxlZoomPercent: 100 });
                                                    fixedLayoutZoomPercent(100); // content natural dimensions (usually larger, so equivalent to zoom in)
                                                } else if (this.state.fxlZoomPercent === 100) {
                                                    this.setState({ fxlZoomPercent: 50 });
                                                    fixedLayoutZoomPercent(50); // half (zoom out, but if the content is massive then it may still be perceived as zoom in)
                                                } else {
                                                    this.setState({ fxlZoomPercent: 0 });
                                                    fixedLayoutZoomPercent(0); // special value: fit inside available viewport dimensions (default)
                                                }
                                            }}
                                            aria-label={__("reader.navigation.pdfscalemode")}
                                            title={__("reader.navigation.pdfscalemode")}
                                        >
                                            <SVG ariaHidden={true} svg={viewMode} />
                                        </button>
                                    </li>
                                    : <></>)
                        }
                    </ul>

                    <ul className={stylesReader.menu_option}>
                        <li
                            {...(this.props.isOnSearch && { style: { backgroundColor: "rgb(193, 193, 193)" } })}
                        >
                            <HeaderSearch shortcutEnable={this.props.shortcutEnable}></HeaderSearch>
                        </li>

                        <li
                            {...(this.props.isOnBookmark &&
                                { style: { backgroundColor: "rgb(193, 193, 193)" } })}
                        >
                            <input
                                id="bookmarkButton"
                                className={stylesReader.bookmarkButton}
                                type="checkbox"
                                checked={this.props.isOnBookmark}
                                onChange={this.props.toggleBookmark}
                                aria-label={__("reader.navigation.bookmarkTitle")}
                                title={__("reader.navigation.bookmarkTitle")}
                            />
                            {
                            // "htmlFor" is necessary as input is NOT located suitably for mouse hit testing
                            }
                            <label
                                htmlFor="bookmarkButton"
                                aria-hidden="true"
                                className={stylesReader.menu_button}
                            >
                                <SVG ariaHidden={true} svg={MarkIcon} />
                            </label>
                        </li>
                        <li
                            {...(this.props.settingsOpen &&
                                { style: { backgroundColor: "rgb(193, 193, 193)" } })}
                        >
                            <button
                                aria-pressed={this.props.settingsOpen}
                                aria-label={__("reader.navigation.settingsTitle")}
                                className={stylesReader.menu_button}
                                onClick={this.props.handleSettingsClick.bind(this)}
                                ref={this.settingsMenuButtonRef}
                                title={__("reader.navigation.settingsTitle")}
                            >
                                <SVG ariaHidden={true} svg={SettingsIcon} />
                            </button>
                            <ReaderOptions {...this.props.readerOptionsProps}
                                isDivina={this.props.isDivina}
                                isPdf={this.props.isPdf}
                                focusSettingMenuButton={this.focusSettingMenuButton} />
                        </li>
                        <li
                            {...(this.props.menuOpen &&
                                { style: { backgroundColor: "rgb(193, 193, 193)" } })}
                        >
                            <button
                                aria-pressed={this.props.menuOpen}
                                aria-label={__("reader.navigation.openTableOfContentsTitle")}
                                className={stylesReader.menu_button}
                                onClick={this.props.handleMenuClick.bind(this)}
                                ref={this.navigationMenuButtonRef}
                                title={__("reader.navigation.openTableOfContentsTitle")}
                            >
                                <SVG ariaHidden={true} svg={TOCIcon} />
                            </button>
                            <ReaderMenu {...this.props.readerMenuProps}
                                isDivina={this.props.isDivina}
                                isPdf={this.props.isPdf}
                                currentLocation={this.props.currentLocation}
                                focusNaviguationMenu={this.focusNaviguationMenuButton} />
                        </li>

                        {this.props.fullscreen ?
                            <li className={classNames(stylesReader.showInFullScreen)}>
                                <button
                                    className={classNames(stylesReader.menu_button)}
                                    onClick={this.props.handleFullscreenClick}
                                    ref={this.disableFullscreenRef}
                                    aria-pressed={this.props.fullscreen}
                                    aria-label={__("reader.navigation.quitFullscreenTitle")}
                                    title={__("reader.navigation.quitFullscreenTitle")}
                                >
                                    <SVG ariaHidden={true} svg={QuitFullscreenIcon} />
                                </button>
                            </li>
                            :
                            <li className={classNames(stylesReader.showInFullScreen, stylesReader.blue)}>
                                <button
                                    className={classNames(stylesReader.menu_button)}
                                    onClick={this.props.handleFullscreenClick}
                                    ref={this.enableFullscreenRef}
                                    aria-pressed={this.props.fullscreen}
                                    aria-label={__("reader.navigation.fullscreenTitle")}
                                    title={__("reader.navigation.fullscreenTitle")}
                                >
                                    <SVG ariaHidden={true} svg={FullscreenIcon} />
                                </button>
                            </li>
                        }
                    </ul>
                    {/*<li className={stylesReader.right}>
                            <button
                                className={stylesReader.menu_button}
                                title={ __("reader.navigation.readBookTitle")}
                            >
                                <SVG ariaHidden={true} svg={AudioIcon} />
                            </button>
                        </li>

                        { this.props.fullscreen ? <></> : () }
                        */}

                </ul>
            </nav>
        );
    }

    private setScaleMode = (mode: IPdfPlayerScale) => {
        this.setState({ pdfScaleMode: mode });
    };

    private focusSettingMenuButton() {
        if (!this.settingsMenuButtonRef?.current) {
            return;
        }
        const button = ReactDOM.findDOMNode(this.settingsMenuButtonRef.current) as HTMLButtonElement;

        button.focus();
    }

    private focusNaviguationMenuButton() {
        if (!this.navigationMenuButtonRef?.current) {
            return;
        }
        const button = ReactDOM.findDOMNode(this.navigationMenuButtonRef.current) as HTMLButtonElement;

        button.focus();
    }
}

const mapStateToProps = (state: IReaderRootState, _props: IBaseProps) => {
    return {
        keyboardShortcuts: state.keyboard.shortcuts,
    };
};

const mapDispatchToProps = (_dispatch: TDispatch, _props: IBaseProps) => {
    return {};
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(ReaderHeader));
