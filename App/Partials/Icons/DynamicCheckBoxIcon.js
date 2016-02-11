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

type Props = {
    selected: React.PropTypes.bool.isRequired,
    color: React.PropTypes.string,
    onPress: React.PropTypes.func,
    size: React.PropTypes.number,
    style: View.propTypes.style
};

class DynamicCheckBoxIcon extends Component {
    constructor(props:Props) {
        super(props);
        this.state = {selected: props.selected};
    };

    render() {
        return (
            <TouchableOpacity
                activeOpacity={0.3}
                onPress={() => {
                    this.props.onPress();
                    this.setState({selected: !this.state.selected});
                }}
                style={[this.props.style, styles.icon]}>
                <Icon
                    name={this.state.selected ? "checkmark-circled" : "record"}
                    size={this.props.size || 25}
                    color={this.props.color || '#ccc'}
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

module.exports = DynamicCheckBoxIcon;