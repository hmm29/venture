/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule BrandLogo
 * @flow
 */

'use strict';

import React, { Component } from 'react';
import {
  Image,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';

import * as Animatable from 'react-native-animatable';

type Props = {
  onLayout: React.PropTypes.func,
  onPress: React.PropTypes.func,
  logoContainerStyle: View.propTypes.style,
};

class BrandLogo extends Component {
  constructor(props:Props) {
    super(props);
    this.state = {
    };
  };

  componentDidMount() {
    this.timer = setTimeout(() => this._animate(), 10);
  };

  componentWillUnmount() {
    clearTimeout(this.timer);
  };

  _animate() {
    this.refs.brandLogo && this.refs.brandLogo.tada(800);
  };

  render() {
    return (
      <Animatable.View onLayout={this.props.onLayout}
                       ref="brandLogo"
                       style={[styles.container, this.props.logoContainerStyle]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
                        this.props.onPress && this.props.onPress();
                        this._animate();
                    }}>
            <Image source={require('../../img/venture_brand_logo_white.png')}
                   style={styles.brandLogo}/>
          </TouchableOpacity>
      </Animatable.View>
    );
  };
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    flex: 1,
    alignSelf: 'center'
  },
  brandLogo: {
    backgroundColor: 'transparent',
    width: 220,
    height: 180
  }
});

module.exports = BrandLogo;