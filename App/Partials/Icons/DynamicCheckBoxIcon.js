/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule DynamicCheckBoxIcon
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

import Icon from 'react-native-vector-icons/Ionicons';

const SIZE = 32; // same as DynamicTimeSelectionIcon

type
Props = {
    selected: React.PropTypes.bool.isRequired,
    caption: React.PropTypes.string,
    color: React.PropTypes.string,
    onPress: React.PropTypes.func.isRequired,
    captionStyle: View.propTypes.style,
    showChevronWhenDisabled: React.PropTypes.array,
    size: React.PropTypes.number,
    style: View.propTypes.style
};

class DynamicCheckBoxIcon extends Component {
    constructor(props:Props) {
        super(props);
        this.state = {};
    }

;

    render() {
        return (
            <View style={styles.container}>
                <TouchableOpacity
                    activeOpacity={0.3}
                    onPress={() => {
                    this.props.onPress();
                }}
                    style={[this.props.style, styles.iconTouchableOpacity]}>
                    <Icon
                        name={this.props.selected ? "checkmark-circled" : (this.props.showChevronWhenDisabled && !!this.props.showChevronWhenDisabled[0] ? "ios-arrow-"+(this.props.showChevronWhenDisabled && this.props.showChevronWhenDisabled[1])  : "record")}
                        size={this.props.size || SIZE}
                        color={this.props.color || '#ccc'}
                        iconStyle={[{width: (this.props.size || SIZE) * 1.14, height: (this.props.size || SIZE) * 1.14, alignSelf: 'center'}]}
                        />
                </TouchableOpacity>
                <Text style={[styles.caption, this.props.captionStyle]}>{this.props.caption}</Text>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    caption: {
        fontSize: 14,
        fontWeight: '500'
    }
});

module.exports = DynamicCheckBoxIcon;