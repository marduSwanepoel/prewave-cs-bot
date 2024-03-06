'use client';

import {createTheme, Theme} from '@mui/material/styles'

export const PaletteConfig = {
    success: '#5DAA60',
    delete: '#DD3E31',
    alert: '#b74440',
    warn: '#E79824',
    info: '#28A6DF',

    primary_light: '#2a7dc5',
    primary_main: '#0d3b66',
    primary_dark: '#0a2f50',

    secondary_light: '#e5f3f8',
    secondary_light_intermediate: '#e3e3e3',
    secondary_main: '#888888',
    secondary_dark: '#494949',

    monochromatic_light: '#459A96',
    monochromatic_main: '#00827E',
    monochromatic_dark: '#2C6764',

    text_primary: '#131313',
    text_secondary: '#363636',
    text_disabled: '#8a8989',

    avatar_green: '#42CD72'
}

export const AppTheme: Theme = createTheme({
    /** PALETTE */
    palette: {
        primary: {
            light: PaletteConfig.primary_light,
            main: PaletteConfig.primary_main,
            dark: PaletteConfig.primary_dark,
        },
        secondary: {
            light: PaletteConfig.secondary_light,
            main: PaletteConfig.secondary_main,
            dark: PaletteConfig.secondary_dark,
        },
        error: {
            light: PaletteConfig.alert,
            main: PaletteConfig.alert,
            dark: PaletteConfig.alert,
        },
        warning: {
            light: PaletteConfig.warn,
            main: PaletteConfig.warn,
            dark: PaletteConfig.warn,
        },
        success: {
            light: PaletteConfig.success,
            main: PaletteConfig.success,
            dark: PaletteConfig.success,
        },
        text: {
            primary: PaletteConfig.text_primary,
            secondary: PaletteConfig.text_secondary,
            disabled: PaletteConfig.text_disabled
        }
    },
    // /** SIZING */
    // shape: {
    //     borderRadius: 5,
    // },
    // mixins: {
    //     toolbar: {
    //         minHeight: 35,
    //     },
    // },
    //
    // /** TYPOGRAPHY */
    // typography: {
    //     fontSize: 13,
    //     fontFamily: ["ProximaNova", "Arial"].join(","),
    //     subtitle1: {
    //         color: PaletteConfig.secondary_dark,
    //         fontSize: 13.5
    //     },
    //     subtitle2: {
    //         color: PaletteConfig.secondary_main,
    //         fontSize: 12.5
    //     },
    //     h3: {
    //         fontWeight: 600,
    //         fontSize: 26,
    //         color: 'black'
    //     },
    //     h4: {
    //         fontWeight: 600,
    //         fontSize: 20,
    //         color: 'black'
    //     },
    //     h5: {
    //         color: PaletteConfig.secondary_dark,
    //         textTransform: 'uppercase',
    //         fontSize: 14
    //     },
    //     h6: {
    //         color: PaletteConfig.secondary_dark,
    //         textTransform: 'uppercase',
    //         fontSize: 13.5
    //     }
    // },
    //
    // /** COMPONENT OVERRIDES */
    // components: {
    //     MuiDrawer: {
    //         styleOverrides: {
    //             paper: {
    //                 borderColor: "transparent"
    //             }
    //         }
    //     },
    //     MuiAutocomplete: {
    //         styleOverrides: {
    //             root: {
    //                 '&.Mui-disabled': {
    //                     color: 'red',
    //                     opacity: 1,
    //                 },
    //             }
    //         }
    //     },
    //     // MuiDataGrid: {
    //     //     styleOverrides: {
    //     //         root: {
    //     //
    //     //             '&.MuiDataGrid-root .MuiDataGrid-columnHeader': {
    //     //                 outline: 'none',
    //     //             },
    //     //             '&.MuiDataGrid-root .MuiDataGrid-cell': {
    //     //                 outline: 'none',
    //     //                 border: 'none'
    //     //             },
    //     //             '& .MuiDataGrid-columnHeader .MuiDataGrid-columnSeparator': {
    //     //                 display: "none"
    //     //             }
    //     //         },
    //     //         cell: {
    //     //         },
    //     //         columnHeader: {
    //     //             backgroundColor: PaletteConfig.secondary_light_intermediate,
    //     //             fontWeight: 'bold'
    //     //         },
    //     //     }
    //     // },
    //     MuiChip: {
    //         styleOverrides: {
    //             root: {
    //                 borderRadius: 5,
    //                 height: 25,
    //                 padding: 0,
    //                 color: 'black'
    //             }
    //         }
    //     },
    //     //todo redo
    //     // @ts-ignore
    //     MuiLoadingButton: {
    //         defaultProps: {
    //             variant: 'outlined'
    //         }
    //     },
    //     MuiButton: {
    //         defaultProps: {
    //             variant: 'contained'
    //         },
    //         styleOverrides: {
    //             root: {
    //                 color: 'primary',
    //                 fontWeight: 600,
    //             }
    //         }
    //     }
    // },
});