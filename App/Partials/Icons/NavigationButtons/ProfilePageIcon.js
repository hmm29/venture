/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule ProfilePageIcon
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

const SIZE = 34;

import Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/Ionicons';

type Props = {
    color: React.PropTypes.string,
    onPress: React.PropTypes.func.isRequired,
    size: React.PropTypes.number,
    style: View.propTypes.style
};

class ProfilePageIcon extends Component {
    constructor(props:Props) {
        super(props);
        this.state = {};
    };

    componentDidMount() {
        this.refs.profilePageIcon.fadeInDown(900);
    };

    render() {
        return (
            <Animatable.View ref="profilePageIcon">
            <TouchableOpacity
                activeOpacity={0.3}
                onPress={this.props.onPress}
                style={[this.props.style, {width: (this.props.size || SIZE) * 2.48, height: (this.props.size || SIZE) * 2.48, justifyContent: 'center', alignItems: 'flex-start'}]}>
                <Icon
                    name="person"
                    size={this.props.size || SIZE}
                    color={this.props.color || 'rgba(255,255,255,0.4'}
                    iconStyle={[styles.icon]}
                    />
            </TouchableOpacity>
                </Animatable.View>
        );
    }
}

const styles = StyleSheet.create({
    icon: {
        opacity: 0.6,
    }
});

module.exports = ProfilePageIcon;