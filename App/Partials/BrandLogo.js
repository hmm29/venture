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
} from 'react-native';

type Props = {
    onPress: React.PropTypes.func
};

class BrandLogo extends Component {
    constructor(props:Props) {
        super(props);
        this.state = {};
    };

    render() {
        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={this.props.onPress}>
                <Image source={require('../../img/venture_brand_logo_white.png')}
                       style={styles.logo}/>
            </TouchableOpacity>
        );
    }
}

const styles = StyleSheet.create({
    logo: {
        backgroundColor: 'transparent'
    }
});

module.exports = BrandLogo;