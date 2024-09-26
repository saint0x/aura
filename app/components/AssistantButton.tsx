import React from 'react';

interface AssistantButtonProps {
  onClick: () => void;
  disabled: boolean;
}

const AssistantButton: React.FC<AssistantButtonProps> = ({ onClick, disabled }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r-lg transition duration-300 ease-in-out ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      Send
    </button>
  );
};

export default AssistantButton;