/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule TutorialNotificationBubble
 * @flow
 */

'use strict';

import React, {Component} from 'react';
import {
  Image,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';

import CloseIcon from '../Partials/Icons/CloseIcon.js';

type Props = {

};

class TutorialNotificationBubble extends Component {
  constructor(props:Props) {
    super(props);
    this.state = {};
  };

  render() {
    return (
      <View style={styles.tutorialNotificationBubble}>
        <View style={styles.tutorialNotificationBubbleSquare}>
          {this.props.children}
          <CloseIcon />
        </View>
        <View style={styles.tutorialNotificationBubbleTriangle}/>
      </View>
    )
  };
}

const styles = StyleSheet.create({
  tutorialNotificationBubble: {
    backgroundColor: 'transparent'
  },
  tutorialNotificationBubbleSquare: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: 120,
    height: 80,
    backgroundColor: 'indigo',
    borderRadius: 10
  },
  tutorialNotificationBubbleTriangle: {
    position: 'absolute',
    top: -26,
    left: 26,
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'indigo',
    borderRightWidth: 13,
    borderLeftWidth: 13,
    borderBottomWidth: 26
  }
});

module.exports = TutorialNotificationBubble;