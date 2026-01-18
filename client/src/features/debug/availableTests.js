export const AVAILABLE_TESTS = [
    {
        name: "Emotion Detection Test",
        description: "Test to evaluate emotion detection capabilities.",
        route: "/debug/emotion",
        active: true
    },
    {
        name: "Instrument Recognition Test",
        description: "Test to evaluate instrument recognition capabilities.",
        route: "/debug/instrument",
        active: false,
    },
    {
        name: "Audio Segregation Test",
        description: "Test to evaluate audio segregation capabilities.",
        route: "/debug/audio",
        active: false,
    },
    {
        name: "Mid Level Features Test",
        description: "Test to evaluate mid-level feature extraction capabilities.",
        route: "/debug/mid-level",
        active: false,
    }
];