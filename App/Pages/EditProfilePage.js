/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule EditProfilePage
 * @flow
 */

'use strict';

var React = require('react-native');
var {
    Image,
    LayoutAnimation,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
    } = React;

var BackIcon = require('../Partials/Icons/NavigationButtons/BackIcon');
var Header = require('../Partials/Header');

var _ = require('lodash');
var AutoComplete = require('react-native-autocomplete');
var Dimensions = require('Dimensions');
var {Icon, } = require('react-native-icons');

var CAMERA_ICON_SIZE = 48;
var CAMERA_REF = 'camera';
var CAMERA_ROLL_OPTION = 'Camera Roll';
var EDIT_GENDER_AUTOCOMPLETE_REF = 'editGenderAutocomplete';
var EDIT_GENDER_ICON_SIZE = 22;
var MAX_TEXT_INPUT_VAL_LENGTH = 30;
var TAKE_PHOTO_OPTION = 'Take Photo';

var BUTTONS = [
    TAKE_PHOTO_OPTION,
    CAMERA_ROLL_OPTION,
    'Cancel'
];
var CANCEL_INDEX = 3;
var {height, width} = Dimensions.get('window');

String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

var EditProfilePage = React.createClass({
    statics: {
        title: '<EditProfile>',
        description: 'Edit current user info.'
    },

    getInitialState() {
        return {
            // cameraType: Camera.constants.Type.back,
            firebaseRef: this.props.firebaseRef,
            hasKeyboardSpace: false,
            showAutocomplete: false,
            showGenderAutocompleteLabel: true,
            showBioField: true,
            showCamera: false,
            isEditingGenderField: false,
            genderMatches: []
        }
    },

    componentWillMount() {
        let ventureId = this.props.ventureId;

        this.state.firebaseRef.child(`users/${ventureId}`).once('value', snapshot => {

            this.setState({
                currentAge: snapshot.val() && snapshot.val().age && snapshot.val().age.value,
                currentBio: snapshot.val() && snapshot.val().bio,
                currentGender: snapshot.val() && snapshot.val().gender,
                currentFirstName: snapshot.val() && snapshot.val().firstName,
                currentPic: snapshot.val() && snapshot.val().picture,
                originalBio: snapshot.val() && snapshot.val().bio,
                originalGender: snapshot.val() && snapshot.val().gender,
                originalPic: snapshot.val() && snapshot.val().picture,
                selectedGender: snapshot.val() && snapshot.val().gender,
                ventureId
            });

        });
    },

    _onBlurBio() {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
        this.setState({hasKeyboardSpace: false});
    },

    _onFocusBio() {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
        this.setState({hasKeyboardSpace: true})
    },

    _onBlurGender() {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
        this.setState({
            showAutocomplete: false,
            isEditingGenderField: false,
            hasKeyboardSpace: false,
            showBioField: true,
            showGenderAutocompleteLabel: true
        });
    },

    _onFocusGender() {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
        this.setState({
            showAutocomplete: true,
            isEditingGenderField: true,
            hasKeyboardSpace: true,
            showBioField: false,
            showGenderAutocompleteLabel: false
        })
    },


    _onTyping(text:string) {
        var GenderList = require('../../data/genders.json').genders;

        let genderMatches =
            _.filter(GenderList, n => _.startsWith(n.toLowerCase(), text.toLowerCase()));

        this.setState({genderMatches});
    },

    saveData() {

        let ventureId = this.props.ventureId;

        this.state.firebaseRef.child(`users/${ventureId}/bio`).set(this.state.currentBio);

        if (this.state.selectedGender !== this.state.originalGender)
            this.state.firebaseRef.child(`users/${ventureId}/gender`).set(this.state.selectedGender.toLowerCase());

        if (this.state.currentPic !== this.state.originalPic)
            this.state.firebaseRef.child(`users/${ventureId}/picture`).set(this.state.currentPic);

        this.props.navigator.pop();
    },

    _setGender(selectedGender:string) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
        this.setState({selectedGender: selectedGender});
        this._onBlurGender()
    },

    /* _showActionSheet() {
        ActionSheetIOS.showActionSheetWithOptions({
                options: BUTTONS,
                cancelButtonIndex: CANCEL_INDEX
            },
            (buttonIndex) => {

                if (BUTTONS[buttonIndex] === TAKE_PHOTO_OPTION) {
                    //@hmm: open React Native camera
                    this.setState({showCamera: true});
                }

                if (BUTTONS[buttonIndex] == CAMERA_ROLL_OPTION) {
                    //@hmm: show camera roll
                    // alert('show camera roll');
                }

            });
    },

    _switchCamera() {
        let state = this.state;
        state.cameraType = state.cameraType === Camera.constants.Type.back
            ? Camera.constants.Type.front : Camera.constants.Type.back;
        this.setState(state);
    },

    _takePicture() {
        let _this = this;

        this.refs[CAMERA_REF].capture(function (err, data) {
            console.log(err, data);

            //@hmm: HACK to add base_64 data to camera images
            // See https://medium.com/@scottdixon/react-native-creating-a-custom-module-to-upload-camera-roll-images-7a3c26bac309

            NativeModules.ReadImageData.readImage(data, (image) => {
                _this.setState({currentPic: 'data:image/jpeg;base64,' + image, showCamera: false});
            })
        });
    }, */

    render() {
        let editBio = (
            <View
                style={styles.editBio}>
                <Text
                    style={styles.label}>Bio</Text>
                <TextInput
                    onBlur={this._onBlurBio}
                    onFocus={this._onFocusBio}
                    autoCapitalize='none'
                    autoCorrect={false}
                    clearButtonMode='unless-editing'
                    onChangeText={(text) => {
                        // @hmm: make sure emojis don't cause error - each emoji counts for 3 characters
                        if(!text.match(/^[a-z0-9A-Z \/_?:;.,-]/) && text.length <= MAX_TEXT_INPUT_VAL_LENGTH + 3 && text.length >= MAX_TEXT_INPUT_VAL_LENGTH - 2) return;
                        this.setState({currentBio: text})
                    }}
                    maxLength={MAX_TEXT_INPUT_VAL_LENGTH}
                    returnKeyType='done'
                    style={styles.bio}
                    value={this.state.currentBio}/>
            </View>
        );

        let editPhoto = (
            <View>
                <TouchableOpacity // onPress={this._showActionSheet}
                    >
                    <Image source={{isStatic: true, uri: this.state.currentPic}} style={styles.currentPic}/>
                </TouchableOpacity>
            </View>
        );

        let genderField = (
            <View style={styles.genderField}>
                <Text style={styles.label}>{this.state.selectedGender && this.state.selectedGender.capitalize()}</Text>
                <TouchableOpacity onPress={() => {
                    this.setState({isEditingGenderField: true, showAutocomplete: true})
                }}>
                    <Icon
                        color="rgba(255,255,255,0.7)"
                        name="ion|edit"
                        size={EDIT_GENDER_ICON_SIZE}
                        style={{width: EDIT_GENDER_ICON_SIZE * 1.4, height: EDIT_GENDER_ICON_SIZE * 1.4, left: 10}}
                        />
                </TouchableOpacity>
            </View>
        );

        let genderAutocomplete = (
            <View style={[styles.genderAutocomplete, (this.state.hasKeyboardSpace && !this.state.showBioField ? {left: width / 6.5} : {})]}>
                {this.state.showGenderAutocompleteLabel ? <Text
                    style={styles.label}>Gender</Text> : <Text/>}
                <AutoComplete
                    ref={EDIT_GENDER_AUTOCOMPLETE_REF}
                    autoCompleteTableCellTextColor={'#fff'}
                    autoCompleteTableOriginOffset={0}
                    autoCompleteTableViewHidden={false}
                    showTextFieldDropShadowWhenAutoCompleteTableIsOpen={false}
                    autoCompleteRowHeight={34}
                    onBlur={this._onBlurGender}
                    onFocus={this._onFocusGender}
                    clearTextOnFocus={true}
                    placeholder='How do you identify?'
                    autoCompleteFontSize={15}
                    autoCompleteRegularFontName='AvenirNextCondensed-Regular'
                    autoCompleteBoldFontName='AvenirNextCondensed-Medium'
                    applyBoldEffectToAutoCompleteSuggestions={true}
                    onSelect={this._setGender}
                    onTyping={this._onTyping}
                    suggestions={this.state.genderMatches}
                    textAlign='center'
                    style={[styles.autocomplete, {height: 40, marginRight: (this.state.showBioField ? 0 : width / 4)}]}
                    />
            </View>
        );

        return this.state.showCamera ?

            <View />

            :

            <View style={styles.container}>
                <View>
                    {this._renderHeader()}
                </View>
                <View style={{bottom: this.state.hasKeyboardSpace ? height/ 3 : 0, backgroundCOlor: ''}}>
                    <Image defaultSource={require('../../img/about.png')} style={styles.backdrop}>

                        {editPhoto}
                        <Text
                            style={[styles.label, {fontSize: 27, marginBottom: width/40}]}>{this.state.currentFirstName} {this.state.currentFirstName ? ',' : ''} {this.state.currentAge}</Text>

                        <View style={styles.editableTextFields}>
                            {this.state.isEditingGenderField && this.state.showAutocomplete ? genderAutocomplete : genderField}

                            {this.state.showBioField ? editBio : <View />}

                        </View>

                        <TouchableOpacity onPress={this.saveData}
                                          style={[styles.saveButton, {top: (this.state.showBioField ? 10 : 115)}]}>
                            <Text style={styles.saveButtonText}>S A V E</Text>
                        </TouchableOpacity>

                    </Image>
                </View>
            </View>
    },

    _renderHeader() {
        return (
            <Header>
                <BackIcon onPress={() => {
                        this.props.navigator.pop();
                    }}/>
                <Text>EDIT PROFILE</Text>
                <View />
            </Header>
        )
    }
});

const styles = StyleSheet.create({
    autocomplete: {
        backgroundColor: 'rgba(9,24,58,0.3)',
        color: '#fff',
        width: width / 2,
        borderRadius: 10,
        top: 10,
        alignSelf: 'stretch'
    },
    backdrop: {
        width,
        height,
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: height / 14,
        backgroundColor: 'transparent'
    },
    bio: {
        backgroundColor: 'rgba(9, 24, 58,0.2)',
        width: width / 2,
        height: width / 8,
        borderRadius: 10,
        paddingLeft: width / 25,
        alignSelf: 'center',
        left: width / 18,
        marginVertical: height / 90,
        fontFamily: 'AvenirNextCondensed-Regular',
        color: 'white',
    },
    cameraContainer: {
        height,
        width,
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: 20
    },
    container: {
        flex: 1,
        backgroundColor: '#02030F'
    },
    currentPic: {
        width: width / 1.8,
        height: width / 1.8,
        borderRadius: width / 3.6,
        bottom: 10
    },
    editableTextFields: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        right: 10,
        bottom: 4
    },
    editBio: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 10,
        justifyContent: 'space-between',
        bottom: 30
    },
    genderAutocomplete: {
        margin: 10,
        flexDirection: 'row'
    },
    genderField: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        margin: 10
    },
    label: {
        color: 'white',
        fontSize: height / 44,
        margin: height / 30,
        fontFamily: 'AvenirNextCondensed-Regular'
    },
    saveButton: {
        backgroundColor: '#040A19',
        alignSelf: 'center',
        borderRadius: 4,
        paddingHorizontal: 30,
        paddingVertical: 5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 15,
        fontFamily: 'AvenirNextCondensed-Medium'
    }
});

module.exports = EditProfilePage;