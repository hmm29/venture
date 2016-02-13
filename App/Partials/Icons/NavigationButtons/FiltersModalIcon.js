/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule FiltersModalIcon
 * @flow
 */

'use strict';

import React, {
    Component,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';

const SIZE = 30;

type Props = {
    color: React.PropTypes.string,
    onPress: React.PropTypes.func.isRequired,
    size: React.PropTypes.number,
    style: View.propTypes.style
};

class FiltersModalIcon extends Component {
    constructor(props:Props) {
        super(props);
        this.state = {};
    };

    render() {
        return (
            <TouchableOpacity
                activeOpacity={0.3}
                onPress={this.props.onPress}
                style={[this.props.style,{width: (this.props.size || SIZE) * 1.48, height: (this.props.size || SIZE) * 1.48, alignItems: 'center'}]} // scale size, 1.48, 1 less than homepageicon scale size due to ios icon difference
                >
                <Icon
                    name={Platform.OS === 'ios' ? "ios-gear-outline" : "android-settings"}
                    size={this.props.size || SIZE}
                    color={this.props.color || '#ccc'}
                    iconStyle={[styles.icon]}
                    />
            </TouchableOpacity>
        );
    }
}

const styles = StyleSheet.create({
    icon: {
        opacity: 1.0
    }
});

module.exports = FiltersModalIcon;