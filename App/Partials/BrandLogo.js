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

import React, {
  Component,
  Image,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';

import Animatable from 'react-native-animatable';

type Props = {
  onHomePage: React.PropTypes.bool,
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
    this._animate();
  };

  _animate() {
    this.refs.brandLogo.tada(800);
  };

  render() {
    return (
      <View onLayout={this.props.onLayout} style={[styles.container, this.props.logoContainerStyle]}>
        <Animatable.View ref="brandLogo">
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
      </View>
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