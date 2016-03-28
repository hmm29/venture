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
  AlertIOS,
  Image,
  InteractionManager,
  LayoutAnimation,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
  } = React;

var _ = require('lodash');
var AutoComplete = require('react-native-autocomplete');
var BackIcon = require('../Partials/Icons/NavigationButtons/BackIcon');
var Dimensions = require('Dimensions');
var Header = require('../Partials/Header');
var {Icon, } = require('react-native-icons');
var ImagePickerManager = require('NativeModules').ImagePickerManager;
var VentureAppPage = require('./Base/VentureAppPage');

var {height, width} = Dimensions.get('window');
var EDIT_GENDER_AUTOCOMPLETE_REF = 'editGenderAutocomplete';
var EDIT_GENDER_ICON_SIZE = 22;
var MAX_TEXT_INPUT_VAL_LENGTH = 30;

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
      firebaseRef: this.props.firebaseRef,
      hasKeyboardSpace: false,
      imgSource: null,
      isEditingGenderField: false,
      genderMatches: [],
      showAutocomplete: false,
      showGenderAutocompleteLabel: true,
      showBioField: true,
      showCamera: false,
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

  componentDidMount() {
    InteractionManager.runAfterInteractions(() => {
      //@hmm: Tutorial modal
      let firstSessionRef = this.props.firebaseRef && this.props.ventureId
        && this.props.firebaseRef.child('users/' + this.props.ventureId + '/firstSession');

      if (this.props.firstSession && !this.props.firstSession.hasVisitedEditProfilePage) {
        AlertIOS.alert(
          'Customize Your Profile',
          'Edit your profile picture and public info. Once you are satisfied, tap the save button to see the updated changes!'
        );
        firstSessionRef.child('hasVisitedEditProfilePage').set(true);
      }
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

    if (this.state.currentPic !== this.state.originalPic || this.state.imgSource) {
      if (this.state.imgSource) {
        this.state.firebaseRef.child(`users/${ventureId}/picture`).set(this.state.imgSource.uri)
      } else {
        this.state.firebaseRef.child(`users/${ventureId}/picture`).set(this.state.currentPic);
      }
    }

    this.props.navigator.pop();
  },

  _setGender(selectedGender:string) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    this.setState({selectedGender: selectedGender});
    this._onBlurGender()
  },

  _showImagePickerOptions() {
    let options = {
      title: null, // specify null or empty string to remove the title
      cancelButtonTitle: 'Cancel',
      takePhotoButtonTitle: 'Take Photo...', // specify null or empty string to remove this button
      chooseFromLibraryButtonTitle: 'Choose from Library...', // specify null or empty string to remove this button
      customButtons: {
        'Use My Facebook Profile Photo': 'fb', // [Button Text] : [String returned upon selection]
      },
      cameraType: 'front', // 'front' or 'back'
      mediaType: 'photo', // 'photo' or 'video'
      videoQuality: 'high', // 'low', 'medium', or 'high'
      maxWidth: width, // photos only
      maxHeight: height, // photos only
      aspectX: 2, // aspectX:aspectY, the cropping image's ratio of width to height
      aspectY: 1, // aspectX:aspectY, the cropping image's ratio of width to height
      quality: 0.8, // photos only
      angle: 0, // photos only
      allowsEditing: true, // Built in functionality to resize/reposition the image
      noData: false, // photos only - disables the base64 `data` field from being generated (greatly improves performance on large photos)
      //storageOptions: { // if this key is provided, the image will get saved in the documents/pictures directory (rather than a temporary directory)
      //  skipBackup: true, // image will NOT be backed up to icloud
      // path: 'images' // will save image at /Documents/images rather than the root
      //}
    };

    ImagePickerManager.showImagePicker(options, (response) => {
      console.log('Response = ', response);

      if (response.didCancel) {
        console.log('User cancelled image picker');
      }
      else if (response.error) {
        console.log('ImagePickerManager Error: ', response.error);
      }
      else if (response.customButton && response.customButton === 'fb') {
        const source = {uri: this.props.defaultFacebookProfilePhoto};
        console.log('User tapped custom button: ', response.customButton);

        this.setState({
          imgSource: source
        });
      }
      else {
        // You can display the image using either data:
        const source = {uri: 'data:image/jpeg;base64,' + response.data, isStatic: true};

        // uri on iOS
        //const source = {uri: response.uri.replace('file://', ''), isStatic: true};

        this.setState({
          imgSource: source
        });
      }
    })
  },

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
                        // @hmm: applies for emojis too
                        if(text.length > MAX_TEXT_INPUT_VAL_LENGTH) return;
                        this.setState({currentBio: text})
                    }}
          returnKeyType='done'
          style={styles.bio}
          value={this.state.currentBio}/>
      </View>
    );

    let editPhoto = (
      <View>
        <TouchableOpacity onPress={this._showImagePickerOptions}
          >
          <Image source={this.state.imgSource || {isStatic: true, uri: this.state.currentPic}}
                 style={styles.currentPic}/>
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
            style={{width: EDIT_GENDER_ICON_SIZE * 1.4, height: EDIT_GENDER_ICON_SIZE * 1.4, left: width/30}}
            />
        </TouchableOpacity>
      </View>
    );

    let genderAutocomplete = (
      <View
        style={[styles.genderAutocomplete, (this.state.hasKeyboardSpace && !this.state.showBioField ? {left: width / 6.5} : {})]}>
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
          style={[styles.autocomplete, {height: 40, marginBottom: height/80, marginRight: (this.state.showBioField ? 0 : width / 4)}]}
          />
      </View>
    );

    return (
      <View style={{backgroundColor: '#040A19'}}>
        <View>
          {this._renderHeader()}
        </View>
        <View style={{bottom: this.state.hasKeyboardSpace ? height/ 3 : 0}}>
          <Image defaultSource={require('../../img/about.png')} style={styles.backdrop}>

            {editPhoto}
            <Text
              style={[styles.label, {fontSize: 27, marginBottom: width/40}]}>{this.state.currentFirstName && this.state.currentFirstName + ','} {this.state.currentAge}</Text>

            <View style={styles.editableTextFields}>
              {this.state.isEditingGenderField && this.state.showAutocomplete ? genderAutocomplete : genderField}

              {this.state.showBioField ? editBio : <View />}

            </View>

            <TouchableOpacity onPress={this.saveData}
                              style={[styles.saveButton, {top: (this.state.showBioField ? -(height/60) : height/6)}]}>
              <Text style={styles.saveButtonText}>S A V E</Text>
            </TouchableOpacity>

          </Image>
        </View>
      </View> );
  },

  _renderHeader() {
    return (
      <Header containerStyle={{backgroundColor: '#040A19'}}>
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
    top: height/30,
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
    height: width / 10,
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
    bottom: height/30
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
    width: width/1.43,
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
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'AvenirNextCondensed-Medium'
  }
});

module.exports = EditProfilePage;