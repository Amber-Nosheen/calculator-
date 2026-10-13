  document.addEventListener('DOMContentLoaded', () => {
            // Calculator State Management
            let currentInput = '0';
            let previousInput = '';
            let operation = null;
            let resetScreenNext = false;
            let calculationComplete = false;

            // DOM Elements
            const currentResultEl = document.getElementById('currentResult');
            const prevOperationEl = document.getElementById('prevOperation');
            const themeToggleBtn = document.getElementById('themeToggleBtn');
            const toastBox = document.getElementById('toastBox');
            const toastMessage = document.getElementById('toastMessage');

            // Theme Management with localStorage persistence
            const savedTheme = localStorage.getItem('novacalc_theme');
            if (savedTheme === 'light') {
                document.documentElement.classList.remove('dark');
            } else {
                document.documentElement.classList.add('dark');
            }

            themeToggleBtn.addEventListener('click', () => {
                const isDark = document.documentElement.classList.toggle('dark');
                localStorage.setItem('novacalc_theme', isDark ? 'dark' : 'light');
            });

            // Toast Alert Handler (Avoiding alert() as mandated)
            let toastTimer = null;
            function showToast(message) {
                toastMessage.textContent = message;
                toastBox.classList.add('show');
                if (toastTimer) clearTimeout(toastTimer);
                toastTimer = setTimeout(() => {
                    toastBox.classList.remove('show');
                }, 3000);
            }

            // Display Auto-scaling for long numbers
            function updateDisplay() {
                // Format current input nicely if it's a plain number string
                let displayStr = currentInput;
                if (!displayStr.includes('Error') && !displayStr.endsWith('.')) {
                    const parts = displayStr.split('.');
                    if (!isNaN(parts[0]) && parts[0] !== '') {
                        // Add commas for integer part separation if not too massive
                        if (parts[0].length < 15 && isFinite(Number(displayStr))) {
                            const numParts = Number(displayStr).toString();
                            // Keep exact string representation if decimal is trailing
                        }
                    }
                }

                currentResultEl.textContent = currentInput;
                prevOperationEl.textContent = previousInput;

                // Adjust font size based on length to prevent overflow
                currentResultEl.classList.remove('scaled-sm', 'scaled-xs');
                if (currentInput.length > 12) {
                    currentResultEl.classList.add('scaled-xs');
                } else if (currentInput.length > 8) {
                    currentResultEl.classList.add('scaled-sm');
                }
            }

            // Safe Math calculation engine (avoiding eval)
            function operate(a, b, op) {
                const num1 = parseFloat(a);
                const num2 = parseFloat(b);
                if (isNaN(num1) || isNaN(num2)) return 0;

                switch (op) {
                    case '+':
                        return num1 + num2;
                    case '-':
                        return num1 - num2;
                    case '*':
                    case '×':
                        return num1 * num2;
                    case '/':
                    case '÷':
                        if (num2 === 0) {
                            throw new Error("Division by zero");
                        }
                        return num1 / num2;
                    default:
                        return num2;
                }
            }

            // Number input handler
            function appendNumber(number) {
                if (calculationComplete) {
                    currentInput = number;
                    calculationComplete = false;
                    resetScreenNext = false;
                    updateDisplay();
                    return;
                }

                if (currentInput === '0' || resetScreenNext) {
                    currentInput = number;
                    resetScreenNext = false;
                } else {
                    if (currentInput.length >= 18) return; // Prevent excessive digit length
                    currentInput += number;
                }
                updateDisplay();
            }

            // Decimal input handler
            function appendDecimal() {
                if (calculationComplete) {
                    currentInput = '0.';
                    calculationComplete = false;
                    resetScreenNext = false;
                    updateDisplay();
                    return;
                }

                if (resetScreenNext) {
                    currentInput = '0.';
                    resetScreenNext = false;
                    updateDisplay();
                    return;
                }

                // Check if current number segment already has decimal
                const lastToken = currentInput.split(/[\+\-\×\÷]/).pop();
                if (!lastToken.includes('.')) {
                    currentInput += '.';
                    updateDisplay();
                }
            }

            // Operator input handler
            function handleOperator(opSymbol) {
                const displayOpMap = { '+': '+', '-': '-', 'multiply': '×', 'divide': '÷', 'add': '+', 'subtract': '-' };
                const actualOp = displayOpMap[opSymbol] || opSymbol;

                if (operation !== null && !resetScreenNext) {
                    try {
                        const parts = previousInput.split(' ');
                        const prevNum = parts[0];
                        const activeOp = parts[1];
                        const result = operate(prevNum, currentInput, activeOp);
                        currentInput = formatResult(result);
                    } catch (err) {
                        showToast(err.message);
                        currentInput = 'Error';
                        updateDisplay();
                        return;
                    }
                }

                operation = actualOp;
                previousInput = `${currentInput} ${operation}`;
                resetScreenNext = true;
                calculationComplete = false;
                updateDisplay();
            }

            // Format calculation results cleanly
            function formatResult(num) {
                if (!isFinite(num)) {
                    throw new Error("Mathematical Error");
                }
                // Handle floating point precision anomalies (e.g. 0.1 + 0.2 = 0.30000000000000004)
                const precisionNum = parseFloat(num.toFixed(10));
                return precisionNum.toString();
            }

            // Equals calculation handler
            function calculateEquals() {
                if (operation === null || previousInput === '') return;

                try {
                    const parts = previousInput.split(' ');
                    const prevNum = parts[0];
                    const activeOp = parts[1];
                    const computation = operate(prevNum, currentInput, activeOp);

                    previousInput = `${prevNum} ${activeOp} ${currentInput} =`;
                    currentInput = formatResult(computation);
                    operation = null;
                    resetScreenNext = true;
                    calculationComplete = true;
                    updateDisplay();
                } catch (err) {
                    showToast(err.message);
                    currentInput = 'Error';
                    previousInput = '';
                    operation = null;
                    resetScreenNext = true;
                    updateDisplay();
                }
            }

            // Percentage conversion handler
            function handlePercentage() {
                try {
                    const val = parseFloat(currentInput);
                    if (isNaN(val)) return;
                    currentInput = (val / 100).toString();
                    updateDisplay();
                } catch (e) {
                    showToast("Invalid operation");
                }
            }

            // Sign toggle handler (+/-)
            function handleSignToggle() {
                if (currentInput === '0' || currentInput === 'Error') return;
                if (currentInput.startsWith('-')) {
                    currentInput = currentInput.slice(1);
                } else {
                    currentInput = '-' + currentInput;
                }
                updateDisplay();
            }

            // Clear All (C)
            function clearAll() {
                currentInput = '0';
                previousInput = '';
                operation = null;
                resetScreenNext = false;
                calculationComplete = false;
                updateDisplay();
            }

            // Delete / Backspace (DEL)
            function deleteDigit() {
                if (calculationComplete || resetScreenNext || currentInput === 'Error') {
                    return;
                }
                if (currentInput.length > 1) {
                    currentInput = currentInput.slice(0, -1);
                } else {
                    currentInput = '0';
                }
                updateDisplay();
            }

            // Event Listeners for Keypad Buttons
            document.querySelectorAll('.btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const value = btn.getAttribute('data-value');
                    const action = btn.getAttribute('data-action');

                    if (value !== null) {
                        appendNumber(value);
                    } else if (action !== null) {
                        switch (action) {
                            case 'clear':
                                clearAll();
                                break;
                            case 'delete':
                                deleteDigit();
                                break;
                            case 'decimal':
                                appendDecimal();
                                break;
                            case 'add':
                            case 'subtract':
                            case 'multiply':
                            case 'divide':
                                handleOperator(action);
                                break;
                            case 'percent':
                                handlePercentage();
                                break;
                            case 'sign':
                                handleSignToggle();
                                break;
                            case 'equals':
                                calculateEquals();
                                break;
                        }
                    }
                });
            });

            // Keyboard support integration
            window.addEventListener('keydown', (e) => {
                if ((e.key >= '0' && e.key <= '9')) {
                    appendNumber(e.key);
                } else if (e.key === '.') {
                    appendDecimal();
                } else if (e.key === '+') {
                    handleOperator('+');
                } else if (e.key === '-') {
                    handleOperator('-');
                } else if (e.key === '*') {
                    handleOperator('×');
                } else if (e.key === '/') {
                    e.preventDefault(); // Prevent browser quick find
                    handleOperator('÷');
                } else if (e.key === 'Enter' || e.key === '=') {
                    e.preventDefault();
                    calculateEquals();
                } else if (e.key === 'Backspace') {
                    deleteDigit();
                } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
                    clearAll();
                } else if (e.key === '%') {
                    handlePercentage();
                }
            });

            // Initial display render
            updateDisplay();
        });