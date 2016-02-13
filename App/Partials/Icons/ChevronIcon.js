/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule ChevronIcon
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

import Icon from 'react-native-vector-icons/Entypo';

const DIRECTIONS = ['up','down','right','left'], SIZE = 25;

type Props = {
    color: React.PropTypes.string,
    direction: React.PropTypes.string.isRequired,
    onPress: React.PropTypes.func.isRequired,
    size: React.PropTypes.number,
    style: View.propTypes.style
};

class ChevronIcon extends Component {
    constructor(props:Props) {
        super(props);
        this.state = {};
    };

    render() {
        return (
            <TouchableOpacity
                activeOpacity={0.3}
                onPress={this.props.onPress}
                style={[this.props.style, {width: (this.props.size || SIZE) * 1.18, height: (this.props.size || SIZE) * 1.18, alignItems: 'center'}]}>
                <Icon
                    name={"chevron-thin-" + (DIRECTIONS.indexOf(this.props.direction) > -1 ? this.props.direction : 'up')}
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

module.exports = ChevronIcon;