/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule Header
 * @flow
 */

'use strict';

var React = require('react');
var ReactNative = require('react-native');

var {
  StyleSheet,
  Text,
  View
  } = ReactNative;

var Dimensions = require('Dimensions');

var {height, width} = Dimensions.get('window');

var Header = React.createClass({
  propTypes: {
    containerStyle: View.propTypes.style
  },

  render() {
    const length = this.props.children.length;

    if (length === 4) {
      return (
        <View style={[styles.headerContainer, this.props.containerStyle]}>
          <View style={styles.header}>
            <View style={{position: 'absolute', left: 10}}>{this.props.children[0]}</View>
            {this.props.children[1]}
            <View style={{position: 'absolute', right: 10}}>{this.props.children[2]}</View>
            {this.props.children[3]}
          </View>
        </View>
      )
    } else if (length === 3) {
      return (
        <View style={[styles.headerContainer, this.props.containerStyle]}>
          <View style={styles.header}>
            <View style={{position: 'absolute', left: 10}}>{this.props.children[0]}</View>
            <Text style={styles.headerText}>{this.props.children[1]}</Text>
            <View style={{position: 'absolute', right: 10}}>{this.props.children[2]}</View>
          </View>
        </View>
      )
    } else if (length === 2) {
      return (
        <View style={[styles.headerContainer, this.props.containerStyle]}>
          <View style={styles.header}>
            <View style={{position: 'absolute', left: 10}}>{this.props.children[0]}</View>
            <View style={{position: 'absolute', right: 10}}>{this.props.children[1]}</View>
          </View>
        </View>
      )
    } else if (length === 1) {
      return (
        <View style={[styles.headerContainer, this.props.containerStyle]}>
          <View style={styles.header}>
            <Text style={styles.headerText}>{this.props.children[0]}</Text>
          </View>
        </View>
      )
    } else {
      return (
        <View style={[styles.headerContainer, this.props.containerStyle]}>
          <View style={styles.header}>
          </View>
        </View>
      )
    }
  }
});

var styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerContainer: {
    width,
    height: height / 20,
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingVertical: height / 15
  },
  headerText: {
    color: '#fff',
    fontSize: 22,
    fontFamily: 'AvenirNextCondensed-Regular'
  }
});

module.exports = Header;