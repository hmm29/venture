/**
 * Created by harrisonmiller on 2/11/16.
 */

'use strict';

var React = require('react-native');
var {
  AsyncStorage,
  InteractionManager,
  Modal,
  Slider,
  StyleSheet,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  View,
  } = React;

var _ = require('lodash');
var CloseIcon = require('../Icons/CloseIcon');
var Dimensions = require('Dimensions');
var Header = require('../Header');

var {height} = Dimensions.get('window');

var FiltersModal = React.createClass({
  propTypes: {
    firebaseRef: React.PropTypes.object,
    modalStyle: View.propTypes.style,
    modalVisible: React.PropTypes.bool.isRequired,
    transparent: React.PropTypes.bool,
    ventureId: React.PropTypes.string
  },

  getInitialState() {
    return {
      ageRangeLower: null,
      ageRangeUpper: null,
      animated: true,
      distance: null,
      firebaseRef: this.props.firebaseRef,
      gender: ['male', 'female', 'other'],
      privacy: ['friends', 'friends+', 'all'],
      transparent: false
    }
  },

  componentDidMount() {
    let _this = this,
      firebaseUserMatchingPreferencesRef = this.state.firebaseRef
        .child(`users/${this.props.ventureId}/matchingPreferences`);

    firebaseUserMatchingPreferencesRef.once('value', snapshot => {
        _this.setState({
          firebaseUserMatchingPreferencesRef,
          distance: snapshot.val() && snapshot.val().maxSearchDistance || 1.0,
          privacy: snapshot.val() && snapshot.val().privacy || [],
          gender: snapshot.val() && snapshot.val().gender || [],
          ageRangeUpper: snapshot.val() && snapshot.val().ageRangeUpper || 25,
          ageRangeLower: snapshot.val() && snapshot.val().ageRangeLower || 18,
          ventureId: snapshot.val() && snapshot.val().ventureId
        });
      }
    );
  },

  saveFilters() {
    let defaultGender = ['male', 'female', 'other'],
      defaultPrivacy = ['friends', 'friends+', 'all'],
      _this = this,
      filtersChanges = {
        ageRangeLower: _this.state.ageRangeLower || 18,
        ageRangeUpper: _this.state.ageRangeUpper || 24,
        gender: (_this.state.gender.length && _this.state.gender) || defaultGender,
        maxSearchDistance: _this.state.distance || 1.0,
        privacy: (_this.state.privacy.length && _this.state.privacy) || defaultPrivacy
      };

    this.setState(filtersChanges);
    this.state.firebaseUserMatchingPreferencesRef.set(filtersChanges);

    this.props.handleShowFiltersModal(false);
  },

  _setButtonState(field:string, value:string) {
    if (field === 'gender') return (this.state.gender && this.state.gender.indexOf(value) > -1 ?
      styles.tabButtonGenderActive : styles.tabButtonGenderInactive);
    else if (field === 'privacy') return (this.state.privacy && this.state.privacy.indexOf(value) > -1 ?
      styles.tabButtonPrivacySettingsActive : styles.tabButtonPrivacySettingsInactive);
  },

  setGendersToIncludeFemale() {
    var genderArr = this.state.gender,
      idx = genderArr.indexOf('female');

    if (idx > -1) genderArr.splice(idx, 1);
    else genderArr.push('female');

    this.setState({
      gender: genderArr
    });
  },

  setGendersToIncludeMale() {
    var genderArr = this.state.gender,
      idx = genderArr.indexOf('male');

    if (idx > -1) genderArr.splice(idx, 1);
    else genderArr.push('male');

    this.setState({
      gender: genderArr
    });
  },

  setGendersToIncludeOther() {
    var genderArr = this.state.gender,
      idx = genderArr.indexOf('other');

    if (idx > -1) genderArr.splice(idx, 1);
    else genderArr.push('other');

    this.setState({
      gender: genderArr
    });
  },

  setPrivacyToAll() {
    var privacyArr = this.state.privacy;

    if (JSON.stringify(privacyArr) === JSON.stringify(['friends', 'friends+', 'all'])) privacyArr.pop();
    else privacyArr = ['friends', 'friends+', 'all'];

    this.setState({
      privacy: privacyArr
    });
  },

  setPrivacyToFriends() {
    var privacyArr = this.state.privacy;

    if (JSON.stringify(privacyArr) === JSON.stringify(['friends'])) privacyArr.pop();
    else privacyArr = ['friends'];

    this.setState({
      privacy: privacyArr
    });
  },

  setPrivacyToFriendsPlus() {
    var privacyArr = this.state.privacy;

    if (JSON.stringify(privacyArr) === JSON.stringify(['friends', 'friends+'])) privacyArr.pop();
    else privacyArr = ['friends', 'friends+'];

    this.setState({
      privacy: privacyArr
    });
  },


  render() {
    return (
      <Modal
        animated={true}
        transparent={this.props.transparent || false}
        visible={this.props.modalVisible}>
        <View style={{flex: 1}}>
          <View>
            {this._renderHeader()}
          </View>
          <View style={styles.container}>
            <View style={styles.section}>
              <View style={styles.titleContainer}>
                <Text style={styles.titleText}>
                  Distance: {(Math.round(100 * this.state.distance) / 100).toFixed(1)} miles
                </Text>
              </View>
              <View style={styles.sliderContainer}>
                <Slider
                  style={styles.slider}
                  minimumTrackTintColor='#2B91FF'
                  onValueChange={(distance) => this.setState({distance})}
                  minimumValue={0.1}
                  maximumValue={10}
                  value={this.state.distance}/>
              </View>
            </View>
            <View style={styles.section}>
              <View style={styles.titleContainer}>
                <Text style={styles.titleText}>
                  Gender:
                </Text>
              </View>
              <View style={styles.tabSettingsGender}>
                <TouchableHighlight style={this._setButtonState('gender', 'male')}
                                    onPress={this.setGendersToIncludeMale}
                                    underlayColor='white'>
                  <Text style={styles.tabButtonText}> Male </Text>
                </TouchableHighlight>
                <TouchableHighlight style={this._setButtonState('gender', 'female')}
                                    onPress={this.setGendersToIncludeFemale}
                                    underlayColor='white'>
                  <Text style={styles.tabButtonText}> Female </Text>
                </TouchableHighlight>
                <TouchableHighlight style={this._setButtonState('gender', 'other')}
                                    onPress={this.setGendersToIncludeOther}
                                    underlayColor='white'>
                  <Text style={styles.tabButtonText}> Other </Text>
                </TouchableHighlight>
              </View>
            </View>
            <View style={styles.section}>
              <View style={styles.titleContainer}>
                <Text style={styles.titleText}>
                  Privacy:
                </Text>
              </View>
              <View style={styles.tabSettingsPrivacy}>
                <TouchableHighlight style={this._setButtonState('privacy', 'friends')}
                                    onPress={this.setPrivacyToFriends}
                                    underlayColor='white'>
                  <Text style={styles.tabButtonText}> Friends </Text>
                </TouchableHighlight>
                <TouchableHighlight style={this._setButtonState('privacy', 'friends+')}
                                    onPress={this.setPrivacyToFriendsPlus}
                                    underlayColor='white'>
                  <Text style={styles.tabButtonText}> Friends + </Text>
                </TouchableHighlight>
                <TouchableHighlight style={this._setButtonState('privacy', 'all')}
                                    onPress={this.setPrivacyToAll}
                                    underlayColor='white'>
                  <Text style={styles.tabButtonText}> All </Text>
                </TouchableHighlight>
              </View>
            </View>
            <TouchableOpacity onPress={this.saveFilters}
                              style={styles.saveButton}>
              <Text
                style={styles.saveButtonText}>S A V E</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  },

  _renderHeader() {
    return (
      <Header containerStyle={{backgroundColor: '#040A19'}}>
        <Text />
        <Text
          style={styles.pageTitle}>SEARCH
          PREFERENCES </Text>
        <CloseIcon onPress={() => {
                                  this.props.handleShowFiltersModal(false);

                    }}/>
      </Header>
    );
  }
});

var styles = StyleSheet.create({
  innerContainer: {
    borderRadius: 10,
    alignItems: 'center',
  },
  container: {
    flexDirection: 'column',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#FFF5EA',
    height: height - 80
  },
  pageTitle: {
    color: '#fff',
    fontSize: 22,
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
  },
  section: {
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: '#040A19',
  },
  slider: {
    height: 30,
    margin: 8
  },
  sliderContainer: {
    padding: 8,
    backgroundColor: '#fff'
  },
  space: {
    height: 30
  },
  tabButtonGenderActive: {
    backgroundColor: '#2B91FF',
    borderRadius: 7,
    padding: 10,
    borderColor: '#fafafa',
    borderWidth: 2,
    width: 75
  },
  tabButtonGenderInactive: {
    backgroundColor: '#2B91FF',
    borderRadius: 7,
    padding: 10,
    borderColor: '#fafafa',
    borderWidth: 1,
    opacity: 0.4,
    width: 75
  },
  tabButtonText: {
    color: 'white',
    fontFamily: 'AvenirNextCondensed-Regular',
    textAlign: 'center'
  },
  titleContainer: {
    backgroundColor: '#040A19',
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  tabButtonPrivacySettingsActive: {
    backgroundColor: '#2B91FF',
    borderRadius: 7,
    padding: 10,
    borderColor: '#fafafa',
    borderWidth: 2,
    width: 75
  },
  tabButtonPrivacySettingsInactive: {
    backgroundColor: '#2B91FF',
    borderRadius: 7,
    padding: 10,
    borderColor: '#fafafa',
    borderWidth: 1,
    opacity: 0.4,
    width: 75
  },
  tabSettingsGender: {
    flexDirection: 'row',
    paddingVertical: 25,
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  tabSettingsPrivacy: {
    flexDirection: 'row',
    paddingVertical: 25,
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  titleText: {
    fontSize: 22,
    fontFamily: 'AvenirNextCondensed-Regular',
    color: '#eee'
  }
});

module.exports = FiltersModal;