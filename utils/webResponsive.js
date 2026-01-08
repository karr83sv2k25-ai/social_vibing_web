// utils/webResponsive.js
import { Platform, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Breakpoints for responsive design
export const BREAKPOINTS = {
    mobile: 480,
    tablet: 768,
    desktop: 1024,
    largeDesktop: 1440,
};

// Check if running on web
export const isWeb = Platform.OS === 'web';

// Get current device type
export const getDeviceType = () => {
    if (!isWeb) return 'mobile';

    if (SCREEN_WIDTH >= BREAKPOINTS.largeDesktop) return 'largeDesktop';
    if (SCREEN_WIDTH >= BREAKPOINTS.desktop) return 'desktop';
    if (SCREEN_WIDTH >= BREAKPOINTS.tablet) return 'tablet';
    return 'mobile';
};

// Check if device is tablet or larger
export const isTabletOrLarger = () => {
    const deviceType = getDeviceType();
    return ['tablet', 'desktop', 'largeDesktop'].includes(deviceType);
};

// Check if device is desktop or larger
export const isDesktopOrLarger = () => {
    const deviceType = getDeviceType();
    return ['desktop', 'largeDesktop'].includes(deviceType);
};

// Get responsive width (percentage or max width)
export const getResponsiveWidth = (percentage = 100, maxWidth = null) => {
    const calculatedWidth = (SCREEN_WIDTH * percentage) / 100;

    if (maxWidth && calculatedWidth > maxWidth) {
        return maxWidth;
    }

    return calculatedWidth;
};

// Get responsive container width for centered content
export const getContainerWidth = () => {
    if (!isWeb) return SCREEN_WIDTH;

    const deviceType = getDeviceType();

    switch (deviceType) {
        case 'largeDesktop':
            return Math.min(SCREEN_WIDTH * 0.6, 1200);
        case 'desktop':
            return Math.min(SCREEN_WIDTH * 0.7, 1000);
        case 'tablet':
            return Math.min(SCREEN_WIDTH * 0.85, 768);
        default:
            return SCREEN_WIDTH;
    }
};

// Get responsive padding
export const getResponsivePadding = (basePadding = 20) => {
    if (!isWeb) return basePadding;

    const deviceType = getDeviceType();

    switch (deviceType) {
        case 'largeDesktop':
            return basePadding * 2;
        case 'desktop':
            return basePadding * 1.5;
        case 'tablet':
            return basePadding * 1.2;
        default:
            return basePadding;
    }
};

// Get responsive font size
export const getResponsiveFontSize = (baseSize = 14) => {
    if (!isWeb) return baseSize;

    const deviceType = getDeviceType();

    switch (deviceType) {
        case 'largeDesktop':
            return baseSize * 1.2;
        case 'desktop':
            return baseSize * 1.1;
        default:
            return baseSize;
    }
};

// Get grid columns based on screen width
export const getGridColumns = (minItemWidth = 150) => {
    const containerWidth = getContainerWidth();
    const columns = Math.floor(containerWidth / minItemWidth);
    return Math.max(columns, 1);
};

// Web-specific styles
export const getWebStyles = () => {
    if (!isWeb) return {};

    return {
        cursor: 'pointer',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
    };
};

// Web-specific input styles
export const getWebInputStyles = () => {
    if (!isWeb) return {};

    return {
        outlineStyle: 'none',
        outlineWidth: 0,
    };
};

// Get responsive image size
export const getResponsiveImageSize = (baseSize = 100) => {
    if (!isWeb) return baseSize;

    const deviceType = getDeviceType();

    switch (deviceType) {
        case 'largeDesktop':
            return baseSize * 1.3;
        case 'desktop':
            return baseSize * 1.2;
        case 'tablet':
            return baseSize * 1.1;
        default:
            return baseSize;
    }
};

// Create responsive container style
export const createResponsiveContainer = (baseStyle = {}) => {
    const containerWidth = getContainerWidth();
    const horizontalPadding = getResponsivePadding();

    return {
        ...baseStyle,
        width: '100%',
        maxWidth: containerWidth,
        paddingHorizontal: horizontalPadding,
        alignSelf: 'center',
    };
};

// Web scrollbar styles (for ScrollView)
export const getWebScrollbarStyles = () => {
    if (!isWeb) return {};

    return {
        // Works in WebKit browsers (Chrome, Safari, Edge)
        '&::-webkit-scrollbar': {
            width: 8,
            height: 8,
        },
        '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
        },
        '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(124, 58, 237, 0.5)',
            borderRadius: 4,
        },
        '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: 'rgba(124, 58, 237, 0.7)',
        },
        // Firefox
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(124, 58, 237, 0.5) rgba(0, 0, 0, 0.1)',
    };
};

// Responsive modal size
export const getResponsiveModalSize = () => {
    if (!isWeb) return { width: '90%', height: 'auto' };

    const deviceType = getDeviceType();

    switch (deviceType) {
        case 'largeDesktop':
            return { width: 600, height: 'auto' };
        case 'desktop':
            return { width: 500, height: 'auto' };
        case 'tablet':
            return { width: '70%', height: 'auto' };
        default:
            return { width: '90%', height: 'auto' };
    }
};

// Check if touch device
export const isTouchDevice = () => {
    if (Platform.OS !== 'web') return true;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Get hover effect styles (only for non-touch devices)
export const getHoverStyles = (hoverColor = 'rgba(124, 58, 237, 0.1)') => {
    if (!isWeb || isTouchDevice()) return {};

    return {
        ':hover': {
            backgroundColor: hoverColor,
        },
    };
};

export default {
    isWeb,
    getDeviceType,
    isTabletOrLarger,
    isDesktopOrLarger,
    getResponsiveWidth,
    getContainerWidth,
    getResponsivePadding,
    getResponsiveFontSize,
    getGridColumns,
    getWebStyles,
    getWebInputStyles,
    getResponsiveImageSize,
    createResponsiveContainer,
    getWebScrollbarStyles,
    getResponsiveModalSize,
    isTouchDevice,
    getHoverStyles,
    BREAKPOINTS,
};
