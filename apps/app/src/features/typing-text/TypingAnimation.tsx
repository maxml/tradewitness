import React, { useState, useEffect } from "react";

const stringsToType = ["Free and Powerful ", "Intuitive and Simple"];

const TypingAnimation = () => {
    const [text, setText] = useState("");
    const [stringIndex, setStringIndex] = useState(0);
    const [typing, setTyping] = useState(true);
    const [charIndex, setCharIndex] = useState(0);

    const [showCursor, setShowCursor] = useState(true);

    const typingSpeed = 80;
    const deletingSpeed = 70;
    const delayBetweenStrings = 1000;

    useEffect(() => {
        let timeout;
        const currentString = stringsToType[stringIndex];

        if (typing) {
            if (charIndex < currentString.length) {
                timeout = setTimeout(() => {
                    setText((prevText) => prevText + currentString[charIndex]);
                    setCharIndex((prevIndex) => prevIndex + 1);
                }, typingSpeed);
            } else {
                timeout = setTimeout(() => {
                    setTyping(false);
                }, delayBetweenStrings);
            }
        } else {
            if (charIndex > 0) {
                timeout = setTimeout(() => {
                    setText((prevText) => prevText.slice(0, -1));
                    setCharIndex((prevIndex) => prevIndex - 1);
                }, deletingSpeed);
            } else {
                timeout = setTimeout(() => {
                    setStringIndex(
                        (prevIndex) => (prevIndex + 1) % stringsToType.length
                    );
                    setTyping(true);
                }, delayBetweenStrings);
            }
        }
        return () => clearTimeout(timeout);
    }, [charIndex, typing, stringIndex]);

    useEffect(() => {
        const cursorInterval = setInterval(() => {
            setShowCursor((prev) => !prev);
        }, 500);

        return () => clearInterval(cursorInterval);
    }, []);

    return (
        <span className="text-[var(--customOrange)]">
            {text}
            {showCursor ? (
                <span>|</span>
            ) : (
                <span style={{ opacity: 0 }}>|</span>
            )}
        </span>
    );
};

export default TypingAnimation;
