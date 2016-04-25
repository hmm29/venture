/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule HotPage
 * @flow
 */

'use strict';

var React = require('react-native');
var {
  ActivityIndicatorIOS,
  AlertIOS,
  Component,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  } = React;

var BrandLogo = require('../../Partials/BrandLogo');
var Dimensions = require('Dimensions');
var Header = require('../../Partials/Header');
var HomePageIcon = require('../../Partials/Icons/NavigationButtons/HomePageIcon');
var Icon = require('react-native-vector-icons/Ionicons');
var Image = require('react-native-image-progress');
var ModalBase = require('../../Partials/Modals/Base/ModalBase');
var Swiper = require('react-native-swiper');
var TimerMixin = require('react-timer-mixin');
var VentureAppPage = require('../Base/VentureAppPage');

var {height, width} = Dimensions.get('window');
var LOGO_WIDTH = 200;
var LOGO_HEIGHT = 120;
var TRENDING_ACTIVITIES_SCROLLVIEW = 'activitiesScrollView';
var TRENDING_USERS_REF = 'trendingUsersRef';

class Title extends Component {
  render() {
    return (
      <Text
        style={[styles.title, {fontSize: this.props.fontSize}, this.props.titleStyle]}>
        {this.props.children}</Text>
    );
  }
}

var HotPage = React.createClass({
  propTypes: {
    handleSelectedTabChange: React.PropTypes.func.isRequired
  },

  mixins: [TimerMixin],

  getInitialState() {
    return {
      activities: [],
      firebaseRef: this.props.firebaseRef,
      showLoadingModal: false,
      trendingContentTitle: 'YALIES',
      users: []
    };
  },

  componentWillMount() {
    let _this = this,
      trendingItemsRef = this.state.firebaseRef.child('trending');

    trendingItemsRef.once('value', snapshot => {
        _this.setState({
          activities: snapshot.val() && snapshot.val().activities,
          users: snapshot.val() && snapshot.val().yalies,
          trendingItemsRef
        });
      }
    );
  },

  componentDidMount() {
    this.setTimeout(() => {
      if (_.isEmpty(this.state.activities.concat(this.state.users))) {
        this.setState({showLoadingModal: true});
      }
      this.setTimeout(() => {
        if (this.state.showLoadingModal) this.setState({showLoadingModal: false});
      }, 5000); // @hmm: timeout for loading modal


      //@hmm: Tutorial modal
      let firstSessionRef = this.props.firebaseRef && this.props.ventureId
        && this.props.firebaseRef.child('users/' + this.props.ventureId + '/firstSession');


      if(this.props.firstSession && !this.props.firstSession.hasVisitedHotPage) {
        AlertIOS.alert(
          'What\'s Hot',
          'See what activities are popular near you! Frequent Venturers will appear as trending in your area.'
        );
        firstSessionRef.child('hasVisitedHotPage').set(true);
      }
    }, 400);
  },

  componentWillUnmount() {
    this.state.trendingItemsRef && this.state.trendingItemsRef.off();
  },

  _createTrendingUserThumbnail(uri, i) {
    return (
      <View
        key={i}
        style={styles.trendingItem}>
        <Image
          style={styles.image}
          source={{uri}}/>
        <Text style={styles.captionStyle}>{uri && uri.substring(uri.lastIndexOf("/")
          +1,uri.lastIndexOf("%"))}</Text>
      </View>
    )
  },

  _renderHeader() {
    return (
      <Header containerStyle={{backgroundColor: '#040A19'}}>
        <HomePageIcon onPress={() => this.props.navigator.popToTop()}/>
        <Text>HOT</Text>
        <Text/>
      </Header>
    )
  },

  render() {
    let users = this.state.users,
        len = users.length, slide1, slide2, slide3, slide4;

    if(len >= 3) {
      slide1 = (
        <View style={styles.slide}>
          {users && _.slice(users, 0, 3) && _.slice(users, 0, 3).map(this._createTrendingUserThumbnail)}
        </View>
      );
    }

    if(len >= 6) {
      slide2 = (
        <View style={styles.slide}>
          {users && _.slice(users, 3, 6) && _.slice(users, 3, 6).map(this._createTrendingUserThumbnail)}
        </View>
      )
    }

    if(len >= 9) {
      slide3 = (
        <View style={styles.slide}>
          {users && _.slice(users, 6, 9) && _.slice(users, 6, 9).map(this._createTrendingUserThumbnail)}
        </View>
      )
    }

    if(len >= 12) {
      slide4 = (
        <View style={styles.slide}>
          {users && _.slice(users, 9, 12) && _.slice(users, 9, 12).map(this._createTrendingUserThumbnail)}
        </View>
      )
    }

    return (
      <VentureAppPage backgroundColor='#000'>
        {this._renderHeader()}
        <View style={styles.container}>
          <Title titleStyle={{fontSize: 18, top: 10}}>TRENDING <Text style={{color: '#ee964b'}}>{this.state.trendingContentTitle}</Text></Title>
          {len <= 6  ?
            <Swiper ref={TRENDING_USERS_REF}
                     autoplay={true}
                     autoplayTimeout={4}
                     buttonWrapperStyle={styles.buttonWrapperStyle}
                     height={100}
                     loop={true}
                     showsButtons={true}
                     showsPagination={false}
                     style={styles.swiper}>
                    {slide1}
                    {slide2}
                  </Swiper>

            :

            (
                len >= 12 ?
                <Swiper ref={TRENDING_USERS_REF}
                        autoplay={false}
                        buttonWrapperStyle={styles.buttonWrapperStyle}
                        height={100}
                        loop={true}
                        showsButtons={true}
                        showsPagination={false}
                        style={styles.swiper}>
                        {slide1}
                        {slide2}
                        {slide3}
                        {slide4}
                      </Swiper>
                :
                <Swiper ref={TRENDING_USERS_REF}
                        autoplay={false}
                        buttonWrapperStyle={styles.buttonWrapperStyle}
                        height={100}
                        loop={true}
                        showsButtons={true}
                        showsPagination={false}
                        style={styles.swiper}>
                        {slide1}
                        {slide2}
                        {slide3}
                      </Swiper>
            )
          }
          <Title titleStyle={{fontSize: 18, top: 10}}>TRENDING <Text style={{color: '#ee964b'}}>ACTIVITIES</Text></Title>
          <ScrollView
            ref={TRENDING_ACTIVITIES_SCROLLVIEW}
            automaticallyAdjustContentInsets={false}
            scrollEventThrottle={200}
            style={styles.scrollView}>
            {this.state.activities && this.state.activities.map((activity) => <Text
              style={[styles.title, {fontSize: height/(this.state.activities.length * 6.5), paddingVertical: 6}]}>
              {activity && activity.toUpperCase()}?</Text>)}
          </ScrollView>
        </View>
        <View style={{height: 48}}></View>
        <ModalBase
          modalStyle={styles.modalStyle}
          animated={true}
          modalVisible={this.state.showLoadingModal}
          transparent={false}>
          <View style={styles.modalView}>
            <BrandLogo
              logoContainerStyle={styles.logoContainerStyle}
              logoStyle={styles.logoStyle}/>
            <ActivityIndicatorIOS
              color='#fff'
              animating={this.state.animating}
              style={styles.loadingModalActivityIndicatorIOS}
              size='small'/>
            <TouchableOpacity activeOpacity={0.8}>
              <Text
                style={styles.loadingModalFunFactText}>
                <Text style={styles.loadingModalFunFactTextTitle}>Did You Know ?</Text>
                {'\n\n'} The phrase "Let's grab a meal" has a 12% success rate.</Text>
            </TouchableOpacity>
          </View>
        </ModalBase>
      </VentureAppPage>
    );
  }
});

const styles = StyleSheet.create({
  buttonWrapperStyle: {
    backgroundColor: 'transparent',
    color: '#fff',
    flexDirection: 'row',
    position: 'absolute',
    top: -10,
    left: 0,
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  captionStyle: {
    color: '#fff',
    fontFamily: 'AvenirNextCondensed-Regular'
  },
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  horizontalScrollView: {
    height: 125
  },
  image: {
    height: 80,
    width: 80,
    borderRadius: 40,
  },
  loadingModalActivityIndicatorIOS: {
    height: 80,
    bottom: height / 40
  },
  loadingModalFunFactText: {
    color: '#fff',
    fontFamily: 'AvenirNextCondensed-Medium',
    textAlign: 'center',
    fontSize: 18,
    alignSelf: 'center',
    width: width / 1.4,
    backgroundColor: 'transparent',
    padding: width / 15,
    borderRadius: width / 10
  },
  loadingModalFunFactTextTitle: {
    fontSize: height / 30
  },
  loadingModalStyle: {
    backgroundColor: '#02030F'
  },
  logoContainerStyle: {
    marginHorizontal: (width - LOGO_WIDTH) / 2
  },
  logoStyle: {
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT
  },
  modalStyle: {
    backgroundColor: '#02030F'
  },
  modalView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  scrollView: {
    height: 150,
    width: width / 1.4,
    borderWidth: 0,
    borderColor: '#fff'
  },
  slide: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'transparent',
    paddingHorizontal: width / 10
  },
  swiper: {},
  title: {
    color: '#fff',
    fontFamily: 'AvenirNextCondensed-Regular',
    fontSize: 30,
    textAlign: 'center',
    paddingVertical: 30
  },
  trendingItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

module.exports = HotPage;