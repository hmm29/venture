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
  Animated,
  Component,
  Image,
  LayoutAnimation,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  } = React;

var BrandLogo = require('../../Partials/BrandLogo');
var ChevronIcon = require('../../Partials/Icons/ChevronIcon');
var Dimensions = require('Dimensions');
var Header = require('../../Partials/Header');
var HomePageIcon = require('../../Partials/Icons/NavigationButtons/HomePageIcon');
var Icon = require('react-native-vector-icons/Ionicons');
var ModalBase = require('../../Partials/Modals/Base/ModalBase');
var ReactFireMixin = require('reactfire');
var TimerMixin = require('react-timer-mixin');
var VentureAppPage = require('../Base/VentureAppPage');

var {height, width} = Dimensions.get('window');
var LOGO_WIDTH = 200;
var LOGO_HEIGHT = 120;

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

  mixins: [TimerMixin, ReactFireMixin],

  getInitialState() {
    return {
      contentOffsetXValue: 0,
      events: [],
      fadeAnim: new Animated.Value(0),
      firebaseRef: this.props.firebaseRef,
      showLoadingModal: false,
      trendingUsers: 'YALIES',
      trendingItems: {},
      yalies: []
    };
  },

  componentWillMount() {
    let _this = this,
      trendingItemsRef = this.state.firebaseRef.child('trending');

    trendingItemsRef.once('value', snapshot => {
        _this.setState({
          events: snapshot.val() && snapshot.val().events,
          yalies: snapshot.val() && snapshot.val().yalies,
          trendingItemsRef
        });
        _this.startAnimation();
      }
    );
  },

  componentDidMount() {
    this.setTimeout(() => {
      if (_.isEmpty(this.state.events.concat(this.state.yalies)))
        this.setState({showLoadingModal: true});
        this.setTimeout(() => {
          if (this.state.showLoadingModal) this.setState({showLoadingModal: false});
        }, 5000); // @hmm: timeout for loading modal
    }, 10);
  },

  componentWillUnmount() {
    this.state.trendingItemsRef && this.state.trendingItemsRef.off();
  },

  startAnimation() {
    Animated.timing(this.state.fadeAnim, {
      toValue: 1,
      duration: 1000,
    }).start();

    this.setTimeout(() => {
      Animated.timing(this.state.fadeAnim, {
        toValue: 0,
        duration: 500,
      }).start();

      this.setTimeout(() => {
        Animated.timing(this.state.fadeAnim, {
          toValue: 1,
          duration: 1000,
        }).start();

        this.setTimeout(() => {
          Animated.timing(this.state.fadeAnim, {
            toValue: 0,
            duration: 500,
          }).start();


        }, 1000);

      }, 1000);

    }, 1000);

  },

  _createTrendingItem(type, uri, i) {
    if (type === 'user') {

      return (
        <TouchableOpacity
          key={i}
          onPress={() => {
                            this._handleTrendingUsersChange(' : '+uri.substring(uri.lastIndexOf("/")
                            +1,uri.lastIndexOf("%")))
                        }}
          style={styles.trendingItem}>
          <Image
            onLoadStart={() => {
                             // @hmm: reset trending content title to yalies when image loads
                             this.setState({trendingUsers: 'YALIES'});

                            if (i === this.state.yalies.length - 1) {
                                 this.setState({showLoadingModal: false});
                                this.setTimeout(() => {
                                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                    this.setState({contentOffsetXValue: width});
                                    this.setTimeout(() => {
                                        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                                        this.setState({contentOffsetXValue: 0});
                                    }, 800);
                                }, 800);

                            }
                            }}

            style={styles.trendingUserImg} source={{uri}}/>
        </TouchableOpacity>
      )
    }

    return (
      <TouchableOpacity key={i} onPress={() => this.props.handleSelectedTabChange('events')}
                        style={styles.trendingItem}>
        <Image style={styles.trendingEventImg} source={{uri}}/>
      </TouchableOpacity>
    )

  },

  _handleTrendingUsersChange(trendingUsers) {
    this.setState({trendingUsers})
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
    return (
      <VentureAppPage backgroundColor='#000'>
        {this._renderHeader()}
        <View style={[styles.tabContent, {flex: 1}]}>
          <View style={[styles.trendingItemsCarousel, {height: height / 5}]}>
            <Title>TRENDING <Text style={{color: '#ee964b'}}>{this.state.trendingUsers}</Text></Title>
            <ScrollView
              ref="trendingYaliesScrollView"
              automaticallyAdjustContentInsets={false}
              contentOffset={{x: this.state.contentOffsetXValue, y: 0}}
              horizontal={true}
              pagingEnabled={true}
              directionalLockEnabled={true}
              onLayout={() => LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)}
              onScroll={this.handleScroll}
              snapToAlignment='center'
              snapToInterval={64}
              showsHorizontalScrollIndicator={true}
              style={[styles.scrollView, styles.horizontalScrollView, {marginTop: 10}]}>
              {this.state.yalies && this.state.yalies.map(this._createTrendingItem.bind(null, 'user'))}
            </ScrollView>
            <View
              style={[styles.scrollbarArrow, {top: height / 10.6,
              left: width / 1.20, backgroundColor: 'transparent'}]}>
              <Animated.View style={{opacity: this.state.fadeAnim}}>
                <ChevronIcon
                  color='rgba(255,255,255,0.8)'
                  size={20}
                  direction={'right'}/>
              </Animated.View>

            </View>
          </View>

          <View style={styles.trendingItemsCarousel}>
            <Title>TRENDING <Text style={{color: '#ee964b'}}>EVENTS</Text></Title>
            <ScrollView
              automaticallyAdjustContentInsets={false}
              horizontal={true}
              pagingEnabled={true}
              directionalLockEnabled={true}
              onScroll={this.handleScroll}
              snapToAlignment='center'
              snapToInterval={width / 1.3}
              showsHorizontalScrollIndicator={true}
              style={[styles.scrollView, styles.horizontalScrollView, {marginTop: 10}]}>
              {this.state.events && this.state.events
                .map(this._createTrendingItem.bind(null, 'event'))}
            </ScrollView>
          </View>
        </View>
        <View style={{height: 48}}/>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#040A19',
    paddingTop: 20,
    paddingBottom: 5
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    paddingVertical: 10,
    fontFamily: 'AvenirNextCondensed-Medium'
  },
  horizontalScrollView: {
    height: 125
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
  scrollbarArrow: {
    position: 'absolute',
  },
  scrollView: {
    backgroundColor: 'rgba(0,0,0,0.008)',
  },
  tabContent: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    color: 'white',
    margin: 50
  },
  title: {
    color: '#fff',
    fontFamily: 'AvenirNextCondensed-Regular',
    fontSize: 20,
    textAlign: 'center',
    paddingTop: 5
  },
  trendingItems: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  trendingItem: {
    borderRadius: 3
  },
  trendingItemsCarousel: {
    width: width / 1.2,
    alignSelf: 'center',
    justifyContent: 'center',
    marginHorizontal: (width - (width / 1.2)) / 2,
    padding: 10,
    margin: 20,
    borderRadius: 10
  },
  trendingUserImg: {
    width: width / 5.2,
    height: 64,
    marginHorizontal: width / 30,
    resizeMode: 'contain'
  },
  trendingEventImg: {
    width: width / 1.3,
    height: 110,
    resizeMode: 'contain'
  }
});

module.exports = HotPage;