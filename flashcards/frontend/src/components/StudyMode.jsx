import React, { useState, useEffect } from 'react';
import ArrowLeftIcon from '@atlaskit/icon/glyph/arrow-left'
import ArrowRightIcon from '@atlaskit/icon/glyph/arrow-right'
import LightbulbIcon from '@atlaskit/icon/glyph/lightbulb';
import EditIcon from '@atlaskit/icon/glyph/edit';
import Textfield from '@atlaskit/textfield';
import { Field } from '@atlaskit/form';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle, ModalTransition } from '@atlaskit/modal-dialog';
import Button from '@atlaskit/button/new';
import './StudyMode.css';
import { invoke } from '@forge/bridge';

const StudyMode = ({ deck }) => {
  //************************** STATE MANAGEMENT **************************************************/
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHintModalOpen, setIsHintModalOpen] = useState(false);
  const [flashcards, setFlashcards] = useState(deck.cards);
  const [sessionId, setSessionId] = useState(null);

  const totalCards = flashcards.length;

  const openHintModal = () => setIsHintModalOpen(true);
  const closeHintModal = () => setIsHintModalOpen(false);

  const openEditModal = () => setIsEditModalOpen(true);
  const closeEditModal = () => setIsEditModalOpen(false);

  //********************** START STUDY SESSION **********************************//
  useEffect(() => {
    const startStudySession = async () => {
      try {
        const response = await invoke('startStudySession', {deckId: deck.id});
        if (response.success) {
          setFlashcards(response.cards);
          setSessionId(response.sessionId);
          setSession(response.session);
          setCurrentCardIndex(response.firstIndex);
          console.log(flashcards);
          console.log("first index is: " + currentCardIndex);
        }
      } catch (error) {
        console.error('response has error: ' + error);
      }
    }

    startStudySession();

  }, [deck.id]);

  //********************** CHANGE FLASHCARD INDEX COMPONENTS **********************************//
  const goToPrevCard = async () => {
    try {
      const response = await invoke('prevCardStudy', {
        currentIndex: currentCardIndex,
        sessionId: sessionId });
      console.log("current card index is: " + currentCardIndex);
      console.log(response)
      if (response.success) {
        setCurrentCardIndex(response.newIndex);
      } else {
        console.error('Valid Response. Error is: ' + response.error);
      }
    } catch (error) {
      console.error('Invalid Response. Error is: ' + error);
    }
  };

  const goToNextCard = async () => {
    try {
      console.log("currentCardIndex:", currentCardIndex); 
      console.log("sessionId:", sessionId);
      
      if (currentCardIndex == null || sessionId == null) {
        console.error('currentCardIndex or sessionId is null or undefined');
        return; 
      }
      
      const response = await invoke('nextCardStudy', {
        currentIndex: currentCardIndex,
        sessionId: sessionId
      });
      
      if (response.success) {
        console.log("Current card index is: " + response.newIndex);
        setCurrentCardIndex(response.newIndex);
      } else {
        console.error("Valid response. Error is: " + response.error);
      }
    } catch (error) {
      console.error('Invalid Response. Error is: ' + error);
    }
  };

  //********************** FLASHCARD MOUSE CLICK COMPONENTS **********************************//
  // Flips the card on mouse click
  const toggleFlip = () => {
    setIsFlipped((prevFlipped) => !prevFlipped);
  };

  // Edit Icon Click 
  const handleEditClick = (event) => {
    event.stopPropagation();
    openEditModal();
  };

  // Hint Icon Click
  const handleHintClick = (event) => {
    event.stopPropagation();
    openHintModal();
  };

  //********************** KEYBOARD SHORTCUT FOR MOVING BETWEEN FLASHCARDS **********************************//
  useEffect(() => {
    const handleKeyDown = async (event) => { 
      console.log('Keydown event detected:', event.key); 
  
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        console.log('ArrowLeft key pressed'); 
        await goToPrevCard();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        console.log('ArrowRight key pressed'); 
        await goToNextCard();
      }
    };
  
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown); 
    }; 
  }, [currentCardIndex, sessionId]); 

  const currentCard = flashcards[currentCardIndex];

  return (
    <div className='study-mode-container'>
      <div className='study-mode-title'>
        <h1>Study Mode for {deck.title}</h1>
      </div>
      <div className='study-mode-information'>
        {/***************************** FLASHCARD INDEX COUNTER *******************************/}
        <h4 className='study-mode-flashcard-counter'>
          Current Flashcard: {currentCardIndex + 1}/{totalCards}
        </h4>
      </div>

      {/********************************* FLASHCARD COMPONENT **********************************/}
      <div
        className={`flip-card ${isFlipped ? 'flipped' : ''}`}
        onClick={toggleFlip}
        id="flipCard"
      >
        <div className='flip-card-inner'>
          <div className='flip-card-front'>
            <div className='flip-card-header'>
              Front
              <div className='flip-card-edit' onClick={handleEditClick}>
                <EditIcon />
              </div>
              <div className='flip-card-hint' onClick={handleHintClick}>
                <LightbulbIcon />
              </div>
            </div>
            <h1>{currentCard.front}</h1>
          </div>
          <div className='flip-card-back'>
            <div className='flip-card-header'>
              Back
              <div className='flip-card-edit' onClick={handleEditClick}>
                <EditIcon />
              </div>
              <div className='flip-card-hint' onClick={handleHintClick}>
                <LightbulbIcon />
              </div>
            </div>
            <h1>{currentCard.back}</h1>
          </div>
        </div>
      </div>

      {/********************************* STUDY MODE ARROW BUTTONS **********************************/}
      <div className='study-mode-bottom-buttons'>
        <div className='study-mode-left-button' onClick={goToPrevCard}>
          <ArrowLeftIcon />
        </div>
        <div className='study-mode-right-button' onClick={goToNextCard}>
          <ArrowRightIcon />
        </div>
      </div>

      {/************************************* EDIT ICON MODAL ***************************************/}
      <ModalTransition>
        {isEditModalOpen && (
          <Modal onClose={closeEditModal}>
            <ModalHeader>
              <ModalTitle>Edit</ModalTitle>
            </ModalHeader>
            <ModalBody>
              {/************************************* FLASHCARD FRONT FIELD ***************************************/}
              <Field id="flashcard-front" name="flashcard-front" label="Flashcard Front">
                {({ fieldProps }) => (
                  <Textfield {...fieldProps} value={currentCard.front} onChange={(e) => setFront(e.target.value)} placeholder="Type the front of the flashcard here..." />
                )}
              </Field>

              {/************************************* FLASHCARD BACK FIELD ***************************************/}
              <Field id="flashcard-back" name="flashcard-back" label="Flashcard Back">
                {({ fieldProps }) => (
                  <Textfield {...fieldProps} value={currentCard.back} onChange={(e) => setBack(e.target.value)} placeholder="Type the back of the flashcard here..." />
                )}
              </Field>
            </ModalBody>
            <ModalFooter>
              <Button appearance="primary" onClick={closeEditModal}>
                Close
              </Button>
            </ModalFooter>
          </Modal>
        )}
      </ModalTransition>

      {/************************************* HINT ICON MODAL ***************************************/}
      <ModalTransition>
        {isHintModalOpen && (
          <Modal onClose={closeHintModal}>
            <ModalHeader>
              <ModalTitle>Hint</ModalTitle>
            </ModalHeader>
            <ModalBody>
              {/************************************* HINT FIELD ***************************************/}
              <Field id="flashcard-hint" name="flashcard-hint" label="Flashcard Hint">
                {({ fieldProps }) => (
                  <Textfield
                    {...fieldProps}
                    value={currentCard?.hint || ''}
                    onChange={(e) => setHint(e.target.value)}
                    placeholder="Type a hint for the flashcard here..."
                  />
                )}
              </Field>
            </ModalBody>
            <ModalFooter>
              <Button appearance="primary" onClick={closeHintModal}>
                Close
              </Button>
            </ModalFooter>
          </Modal>
        )}
      </ModalTransition>
    </div>
  );
};

export default StudyMode;
