import React, { useState, useEffect, useRef } from 'react';
import VanillaTilt from 'vanilla-tilt';
import { toast } from 'sonner';
import { Button } from './ui/button';

const MAX_SELECTIONS = 20;
const BET_AMOUNTS = [10, 20, 50, 100];

const KenoBoard = () => {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [selectedBet, setSelectedBet] = useState<number>(BET_AMOUNTS[0]);
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (boardRef.current) {
      VanillaTilt.init(boardRef.current, {
        max: 10,
        speed: 400,
        glare: true,
        'max-glare': 0.2,
      });
    }
    
    console.log('Keno board initialized');
  }, []);

  const handleNumberClick = (number: number) => {
    console.log('Number clicked:', number);
    
    if (!selectedBet) {
      toast.error('Please select a bet amount first');
      return;
    }

    setSelectedNumbers(prev => {
      if (prev.includes(number)) {
        console.log('Number deselected:', number);
        return prev.filter(n => n !== number);
      }
      
      if (prev.length >= MAX_SELECTIONS) {
        console.log('Maximum selections reached');
        toast.error(`Maximum ${MAX_SELECTIONS} numbers allowed`);
        return prev;
      }
      
      console.log('Number selected:', number);
      return [...prev, number];
    });
  };

  const handleBetSelection = (amount: number) => {
    console.log('Bet amount selected:', amount);
    setSelectedBet(amount);
    toast.success(`Bet amount set to $${amount}`);
  };

  const clearSelections = () => {
    console.log('Clearing selections');
    setSelectedNumbers([]);
    toast.success('Selections cleared');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-purple-900 to-gray-900">
      {/* Bet Selection */}
      <div className="mb-6 flex gap-4">
        {BET_AMOUNTS.map((amount) => (
          <button
            key={amount}
            onClick={() => handleBetSelection(amount)}
            className={`
              px-6 py-2 rounded-full font-bold text-lg transition-all duration-300
              ${selectedBet === amount ? 'betting-amount-selected' : 'bg-gray-800 text-white hover:bg-gray-700'}
            `}
          >
            ${amount}
          </button>
        ))}
      </div>

      <div 
        ref={boardRef}
        className="keno-board p-6 rounded-xl shadow-2xl max-w-3xl w-full"
      >
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-white tracking-wider">KENO</h1>
          <div className="text-white">
            Selected: {selectedNumbers.length}/{MAX_SELECTIONS}
          </div>
        </div>
        
        <div className="grid grid-cols-10 gap-1.5 bg-black/50 p-4 rounded-lg">
          {Array.from({ length: 80 }, (_, i) => i + 1).map(number => (
            <button
              key={number}
              onClick={() => handleNumberClick(number)}
              className={`
                number-cell
                aspect-square
                flex
                items-center
                justify-center
                text-base
                font-bold
                rounded-full
                transition-all
                duration-300
                ${
                  selectedNumbers.includes(number)
                    ? 'number-selected'
                    : 'bg-gray-800 text-white hover:bg-gray-700'
                }
              `}
            >
              {number}
            </button>
          ))}
        </div>
      </div>
      
      <Button
        onClick={clearSelections}
        className="mt-4 bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full"
      >
        Clear Selections
      </Button>
    </div>
  );
};

export default KenoBoard;