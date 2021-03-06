function compute(s) {
  function parseCalculationString(s) {
    // --- Parse a calculation string into an array of numbers and operators
    var calculation = [],
    current = '';
    for (var i = 0, ch; ch = s.charAt(i); i++) {
      if ('^*/+-'.indexOf(ch) > -1) {
        if (current == '' && ch == '-') {
          current = '-';
        } else {
          calculation.push(parseFloat(current), ch);
          current = '';
        }
      } else {
        current += s.charAt(i);
      }
    }
    if (current != '') {
      calculation.push(parseFloat(current));
    }
    return calculation;
  }

  function calculate(calc) {
    // --- Perform a calculation expressed as an array of operators and numbers
    var ops = [{
      '^': function (a, b) {
        return Math.pow(a, b);
      } },
    {
      '*': function (a, b) {
        return a * b;
      },

      '/': function (a, b) {
        return a / b;
      } },
    {
      '+': function (a, b) {
        return a + b;
      },

      '-': function (a, b) {
        return a - b;
      } }],

    newCalc = [],
    currentOp;
    for (var i = 0; i < ops.length; i++) {
      for (var j = 0; j < calc.length; j++) {
        if (ops[i][calc[j]]) {
          currentOp = ops[i][calc[j]];
        } else if (currentOp) {
          newCalc[newCalc.length - 1] = currentOp(newCalc[newCalc.length - 1], calc[j]);
          currentOp = null;
        } else {
          newCalc.push(calc[j]);
        }
        console.log(newCalc);
      }
      calc = newCalc;
      newCalc = [];
    }
    if (calc.length > 1) {
      console.log('Error: unable to resolve calculation');
      return calc;
    } else {
      return calc[0];
    }
  }
  return calculate(parseCalculationString(s));
}


const isOperator = /[x/+‑]/,
endsWithOperator = /[x+‑/]$/,
endsWithNegativeSign = /[x/+]‑$/,
startsWithOperator = /^[x+/]/;



class Calculator extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      previousValue: '0',
      currentValue: '0',
      formula: '',
      currentSign: 'pos',
      lastClicked: '' };


    this.maxDigitsWarning = this.maxDigitsWarning.bind(this);
    this.handleOperators = this.handleOperators.bind(this);
    this.handleNumbers = this.handleNumbers.bind(this);
    this.handleDecimals = this.handleDecimals.bind(this);
    this.clear = this.clear.bind(this);
    this.evaluation = this.evaluation.bind(this);
    this.toggleToNegative = this.toggleToNegative.bind(this);
    this.toggleToPositive = this.toggleToPositive.bind(this);
    this.handleToggleSign = this.handleToggleSign.bind(this);
    this.lockOperators = this.lockOperators.bind(this);
    this.handleCE = this.handleCE.bind(this);
  }

  toggleToNegative(formula, currentValue) {
    this.setState({
      currentValue: '-' + this.state.formula.match(/(\d*\.?\d*)$/)[0], // matching the ending number part of formula(inclusive of decimals) and attaching a negative sign in front. ie. 9 to -9
      formula: formula.replace(/(\d*\.?\d*)$/, '(-' + this.state.formula.match(/(\d*\.?\d*)$/)[0]), //we add a open paranthesis with negative sign to the matched number part of formula ie. 9 to (-9
      currentSign: 'neg' // to toggle between positive and negative
    });
  }

  toggleToPositive(formula, lastOpen, currentValue) {// remember this only works for when toggling from neg to pos. further details in handle toggle function...
    this.setState({
      currentSign: 'pos' });

    if (this.state.lastClicked == 'CE') {//when we clear our last entry...
      this.setState({
        currentValue: this.state.formula.match(/(\d*\.?\d*)$/)[0], //just match the part without the negative sign
        formula: formula.substring(0, lastOpen) + formula.substring(lastOpen + 2) //we match the last open para at the end of formula and then toggle it back to positive(since negative toggle adds an open para). the reason we match the end is cos we always toggle from the back. i.e. (-9 to 9
      });
    } else
    if (currentValue == '-') {
      this.setState({
        currentValue: '0',
        formula: formula.substring(0, lastOpen) + formula.substring(lastOpen + 2) // when toggling to and from negative sign(when current value is literally a negative sign, this will reset current value to 0 and then removing (- from formula.   
      });
    } else
    {
      this.setState({
        currentValue: currentValue.slice(currentValue.indexOf('-') + 1), // basically get the number without the negative sign
        formula: formula.substring(0, lastOpen) + formula.substring(lastOpen + 2) // same as the above 2 scenarios where we remove the (-
      });
    }
  }


  handleToggleSign() {
    this.setState({
      lastClicked: 'toggleSign' });

    if (this.state.lastClicked == 'evaluated') {//toggling the evaluated formula requires specific scenario management...
      this.setState({
        currentValue: this.state.currentValue.indexOf('-') > -1 ?
        this.state.currentValue.slice(1) :
        '-' + this.state.currentValue, //i.e evaluating 6-9 gives us -3 as currentvalue where formula = 6-9=-3. by clicking on toggle, we remove the - from -3 to make it 3. and if the formula is now 9-6=3, clicking on toggle makes currentvalue become -3.
        formula: this.state.currentValue.indexOf('-') > -1 ?
        this.state.currentValue.slice(1) :
        '(-' + this.state.currentValue, //i.e 7-9= -2. where currentvalue is also -2. we can then click the toggle button and evaluate this formula to become 2. this is why we just slice off the negative sign from current value. and if formula is now 9-7, we add an open parathesis with a negative sign to currentvalue, and that is our new formula.
        currentSign: this.state.currentValue.indexOf('-') > -1 ?
        'pos' :
        'neg' // to toggle between pos and neg so that the right function is called. see the                                  2 cases below
      });
    } else
    if (this.state.currentSign == 'neg') {
      this.toggleToPositive(
      this.state.formula,
      this.state.formula.lastIndexOf('(-'), //last index ensures we find the open paranthesis with the negative sign at the last part of formula so that we remove the right paranthesis/negative sign.
      this.state.currentValue //Also refer to toggleToPositive function for more clarity
      );
    } else
    {
      this.toggleToNegative(
      this.state.formula,
      this.state.currentValue //just refer to toggleToNegative function for more clarity
      );
    }
  }


  lockOperators(formula, currentValue) {
    return formula.lastIndexOf('.') == formula.length - 1 || formula.lastIndexOf('-') == formula.length - 1 || currentValue.indexOf('Met') != -1;
  } // we eliminate scenarios with more than 1 decimal at the end, as well as evaluating a formula that ends with a decimal or a minus sign(this is to account for handle operators). and the second case is just preventing calculations when max digits entered.


  maxDigitsWarning() {
    this.setState({
      currentValue: 'Max limit reached',
      previousValue: this.state.currentValue //set currentvalue to max digits reached to display on calculator and then previous value back to currentvalue so that after 1s timeout it will set currentvalue back to initial current value before max digit limits reached.
    });
    setTimeout(() => this.setState({ currentValue: this.state.previousValue }), 1000);
  }


  handleOperators(event) {
    if (!this.lockOperators(this.state.formula, this.state.currentValue)) {
      this.setState({
        currentSign: 'pos',
        currentValue: event.target.value,
        lastClicked: 'operator' //default currentvalue,lastclicked and currentsign values for when an operator is clicked
      });
      if (this.state.formula.lastIndexOf('(') > this.state.formula.lastIndexOf(')')) {
        this.setState({
          formula: this.state.formula + ')' + event.target.value,
          previousValue: this.state.formula + ')' //we account for more than 1 paranthesis. for the case where there is an open paranthesis and its not closed then we will close it whenver we insert an operator. ie (-9-> (-9)+8
        });
      } else
      if (this.state.formula.indexOf('=') != -1) {
        this.setState({
          formula: this.state.previousValue + event.target.value //since previousvalue stores the result of evaluation, we can simply just add the operator sign to the back of formula. ie 9+8 = 17  where preivous value is 17 and when we add a '+' sign => 17+        
        });
      } else
      {
        this.setState({
          previousValue: !isOperator.test(this.state.currentValue) ?
          this.state.formula :
          this.state.previousValue, //i.e. if currentvalue is + then if formula is 99+ then previous value will be 99, if formula is 99, previous value will just be 99. this is so that we can switch operators instead of adding it. either 9+ to 9* instead of 9+* which will cause calculation complications.
          formula: !isOperator.test(this.state.currentValue) ?
          this.state.formula += event.target.value :
          (endsWithNegativeSign.test(this.state.formula + event.target.value) ? this.state.formula : this.state.previousValue) + event.target.value // this is just straight forward adding the target value to formula. if its a number, add to the existing number which is previous value/formula, if it contains an operator then ignore the operator, add the new oprator to the previous value which is the number without the old operator.
        });
      }
    }
  }

  handleNumbers(event) {
    if (!this.state.currentValue.includes('limit')) {
      this.setState({
        lastClicked: 'num' });

      if (this.state.currentValue.length > 16) {
        this.maxDigitsWarning();
      } else
      if (this.state.lastClicked == 'CE' && this.state.formula !== '') {
        this.setState({
          currentValue: !endsWithOperator.test(this.state.formula) ?
          this.state.formula.match(/(-?\d+\.?\d*)$/)[0] + event.target.value :
          event.target.value,
          formula: this.state.formula += event.target.value });
        //we cleared the last entry and formula still has something ie not blank state then if it ends with an operator, then current value is just the target value, but if it ends with a number then we just attach the value to back part of this.state.formula that matches a number
      } else
      if (this.state.formula.indexOf('=') != -1) {
        this.setState({
          currentValue: event.target.value,
          formula: event.target.value != '0' ?
          event.target.value :
          '' });
        //immediately after evaluation, when number is keyed in then it resets the currentvalue and formula. if value is 0 then formula is blank while current value is 0.
      } else
      {
        this.setState({
          currentValue: this.state.currentValue == '0' || isOperator.test(this.state.currentValue) ?
          event.target.value :
          this.state.currentValue + event.target.value, //if currentvalue is an operator or 0 then current value is replaced by the new value, if its not, then add on to the back of it.
          formula: this.state.currentValue == '0' && event.target.value == '0' ?
          this.state.formula :
          /([^.0-9]0)$/.test(this.state.formula) ?
          this.state.formula.slice(0, -1) + event.target.value :
          this.state.formula + event.target.value //if currentvalue and value is 0 then formula does not change. if its not then we add value to the end of formula.
        });
      }
    }
  }

  handleDecimals() {
    if (!this.state.currentValue.includes('limit') && !this.state.currentValue.includes('.')) {
      this.setState({
        lastClicked: this.state.lastClicked == 'CE' ?
        'CE' :
        'decimal' //if the last button pressed was clear entry, we remain it as clear entry for easy toggle of pos/neg signs. 
      });
      if (this.state.currentValue.length > 16) {
        this.maxDigitsWarning();
      } else
      if (this.state.lastClicked == 'evaluated' ||
      endsWithOperator.test(this.state.formula) ||
      this.state.currentValue == '0' && this.state.formula === '' || /-$/.test(this.state.formula)) {
        this.setState({
          currentValue: '0.',
          formula: this.state.lastClicked == 'evaluated' ?
          '0.' :
          this.state.formula + '0.' // cases where 9+9 = 18 / 9+ or blank state, such that when we press decimal we get '0.'' for the current value. for formula, when evaluated state, reset back to 0. for formula while if not evaluated state, add a '0.' to the end of formula. i.e. 9+ => 9+0.
        });
      } else
      if (this.state.formula.match(/(\(?\d+\.?\d*)$/)[0].indexOf('.') > -1) {
        //we need this because clear entry will set currentvalue to 0. formula may have decimal inside already, but since currentvalue is 0, the !this.state.currentValue.includes('.') statement will not exclude it. 
      } else
      {
        this.setState({
          currentValue: this.state.formula.match(/(-?\d+\.?\d*)$/)[0] + '.',
          formula: this.state.formula + '.' });
        //basically just add decimal point to the back of currentvalue and formula for the other scenarios.
      }
    }
  }



  clear() {
    this.setState({
      currentValue: '0',
      previousValue: '0',
      formula: '',
      currentSign: 'pos',
      lastClicked: '' });
    //reset everything back to initial state aka AC button
  }

  handleCE() {
    let thisWith = new RegExp(/[x+‑\/]$|(\d+\.?\d*)$|(\(-\d+\.?\d*)$|(\(-)$|\)[x+‑\/]$/); //ends with operator/ends with number with or without decimal/ends with number with negative sign and open parathesis(toggled to negative)/ends with just open parathesis negative sign and no number(when you toggle currentvalue 0 to negative)/closed bracket with parathesis, i.e. the )+ part of (-9)+. 

    // *another thing is why no need escape special metacharacter with double // is cause our constructor is matching with a string literal /s+/ instead of a constructor where quotes are used 's+'*

    if (this.state.formula.indexOf('=') != -1) {
      this.clear();
    } else

    {
      this.setState({
        formula: this.state.formula.replace(thisWith, ''),
        currentValue: '0',
        lastClicked: 'CE' });

    }

    setTimeout(() => {
      this.setState({
        currentSign: this.state.formula === '' ||
        endsWithOperator.test(this.state.formula) ||
        this.state.formula.match(/(\(?-?\d+\.?\d*)$/)[0].indexOf('-') == -1 ?
        'pos' :
        'neg' //setting state after clearing entry...
      });
    }, 100);
  } //we need to match the whole open paranthesis + negative sign + number cause we need to detect the negative sign and open paranthesis, so that we can check if its negative(i.e. it matches that regex and index is not -1. if we just match the number portion then it will always be positive since the number wont include the parathesis or the negative sign.

  evaluation() {
    if (!this.lockOperators(this.state.formula, this.state.currentValue)) {
      let expression = this.state.formula;
      if (endsWithOperator.test(expression)) {
        expression = expression.slice(0, -1);
      }
      expression = expression.replace(/x/g, "*").replace(/‑/g, "-");
      expression = expression.lastIndexOf('(') > expression.lastIndexOf(')') ?
      expression + ')' : expression;
      let answer = Math.round(10000000 * eval(expression)) / 10000000;
      this.setState({
        currentValue: answer.toString(),
        formula: expression.replace(/\*/g, "⋅").replace(/-/g, "‑") + "=" + answer,
        previousValue: answer,
        currentSign: answer[0] == '-' ?
        'neg' :
        'pos',
        lastClicked: 'evaluated' });

    }
  }

  render() {
    return (
      React.createElement("div", { className: "frame" },
      React.createElement(TopScreen, { formula: this.state.formula }),
      React.createElement(BottomScreen, { currentval: this.state.currentValue }),
      React.createElement(Buttons, { decimal: this.handleDecimals,
        equal: this.evaluation,
        numbers: this.handleNumbers,
        operators: this.handleOperators,
        clear: this.clear,
        handleToggleSign: this.handleToggleSign,
        handleCE: this.handleCE })));



  }}


class Buttons extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      React.createElement("div", null,
      React.createElement("button", { id: "clear", className: "red", onClick: this.props.clear }, "A/C"),
      React.createElement("button", { value: "CE", className: "red", onClick: this.props.handleCE }, "CE"),
      React.createElement("button", { value: "\xB1", className: "operators", onClick: this.props.handleToggleSign }, "\xB1"),
      React.createElement("button", { id: "add", className: "operators", onClick: this.props.operators, value: "+" }, "+"),
      React.createElement("button", { id: "subtract", className: "operators", onClick: this.props.operators, value: "\u2011" }, "-"),
      React.createElement("button", { id: "seven", onClick: this.props.numbers, value: "7" }, "7"),
      React.createElement("button", { id: "eight", onClick: this.props.numbers, value: "8" }, "8"),
      React.createElement("button", { id: "nine", onClick: this.props.numbers, value: "9" }, "9"),
      React.createElement("button", { id: "multiply", className: "operators", onClick: this.props.operators, value: "x" }, "x"),
      React.createElement("button", { id: "four", onClick: this.props.numbers, value: "4" }, "4"),
      React.createElement("button", { id: "five", onClick: this.props.numbers, value: "5" }, "5"),
      React.createElement("button", { id: "six", onClick: this.props.numbers, value: "6" }, "6"),
      React.createElement("button", { id: "divide", className: "operators", onClick: this.props.operators, value: "/" }, "/"),
      React.createElement("button", { id: "one", onClick: this.props.numbers, value: "1" }, "1"),
      React.createElement("button", { id: "two", onClick: this.props.numbers, value: "2" }, "2"),
      React.createElement("button", { id: "three", onClick: this.props.numbers, value: "3" }, "3"),
      React.createElement("button", { id: "decimal", className: "operators", onClick: this.props.decimal }, "."),
      React.createElement("button", { id: "zero", onClick: this.props.numbers, value: "0" }, "0"),
      React.createElement("button", { id: "equals", onClick: this.props.equal }, "=")));


  }}
;

class TopScreen extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      React.createElement("div", { id: "formulascreen" },
      this.props.formula));


  }}
;

class BottomScreen extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      React.createElement("div", { id: "display" },
      this.props.currentval));


  }}
;



ReactDOM.render(React.createElement(Calculator, null), document.getElementById("calculator"));