/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule DynamicTimeSelectionIcon
 * @flow
 */

'use strict';

import React, {
  Component,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import {Icon, } from 'react-native-icons';

const SIZE = 32; // same as DynamicCheckBoxIcon

type Props = {
  selected: React.PropTypes.bool.isRequired,
  caption: React.PropTypes.string,
  color: React.PropTypes.string,
  onPress: React.PropTypes.func.isRequired,
  captionStyle: View.propTypes.style,
  size: React.PropTypes.number,
  style: View.propTypes.style
};

class DynamicTimeSelectionIcon extends Component {
  constructor(props:Props) {
    super(props);
    this.state = {};
  };

  render() {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          activeOpacity={0.3}
          onPress={() => {
                    this.props.onPress();
                }}
          style={this.props.style}>
          <Icon
            name={"ion|" + (this.props.selected ? "checkmark-circled" : "clock")}
            size={this.props.size || SIZE}
            color={this.props.color || '#ccc'}
            style={[{width: (this.props.size || SIZE) * 1.14,
                        height: (this.props.size || SIZE) * 1.14}, styles.icon]}
            />
        </TouchableOpacity>
        <Text style={[styles.caption, this.props.captionStyle]}>{this.props.caption}</Text>
      </View>
    );
  };
}

const styles = StyleSheet.create({
  icons: {
    width: SIZE,
    height: SIZE
  },
  container: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center'
  },
  caption: {
    fontSize: 14,
    fontWeight: '500'
  }
});

module.exports = DynamicTimeSelectionIcon;