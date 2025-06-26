import React, { useState, useEffect } from 'react';
import { invoke } from '@forge/bridge';
import Button, { IconButton } from '@atlaskit/button/new';
import { Field } from '@atlaskit/form';
import CrossIcon from '@atlaskit/icon/glyph/cross';
import { Flex, Grid, xcss } from '@atlaskit/primitives';
import Textfield from '@atlaskit/textfield';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle, ModalTransition } from '@atlaskit/modal-dialog';
import UnlockIcon from '@atlaskit/icon/glyph/unlock';
import LockIcon from '@atlaskit/icon/glyph/lock';
import Alert from '@mui/material/Alert';
import Collapse from '@mui/material/Collapse';
import './GlobalPageDeckCreate.css';

//grid and layout styles
const gridStyles = xcss({
  width: '100%',
});

const closeContainerStyles = xcss({
  gridArea: 'close',
});

const titleContainerStyles = xcss({
  gridArea: 'title',
});

function EditFlashcardGlobal({ flashcard, closeFlashcardEditModal }) {

  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [hint, setHint] = useState('');
  const [locked, setLocked] = useState(false);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [closeError, setCloseError] = useState(true);

  // Pre-fill the form with the current flashcard details
  useEffect(() => {
    if (flashcard) {
      setFront(flashcard.front || '');
      setBack(flashcard.back || '');
      setHint(flashcard.hint || '');
      setLocked(flashcard.locked || '');
    }
  }, [flashcard]);

  // Handle modal close
  const handleClose = () => {
    if (typeof closeFlashcardEditModal === 'function') {
      closeFlashcardEditModal(); // Call the function passed as a prop
    } else {
      console.error('closeFlashcardEditModal is not a function:', closeFlashcardEditModal);
    }
  };

  // Handle save
  const handleSaveGlobal = async () => {
    try {
      console.log(flashcard.id);
      const response = await invoke('updateFlashcard', {
        id: flashcard.id,
        front: front,
        back: back,
        hint: hint,
        locked: locked
      });

      if (response && response.success) {
        setSaveSuccess(true);
        setTimeout(() => {
          closeFlashcardEditModal(response.card);
        }, 1000);
      }  else {
        console.error('Failed to update flashcard:', response.error);
        setErrorMessage(response.error);
        setTimeout(() => {
          closeFlashcardEditModal(flashcard);
        }, 1000);
        setSaveSuccess(false);
      }
    } catch (error) {
      console.error('Error invoking updateFlashcard:', error);
    }
  };


  return (
    <ModalTransition>
      <Modal onClose={closeFlashcardEditModal}>
        {/************************************* HEADER SECTION ***************************************/}
        <ModalHeader>
          <Grid templateAreas={['title close']} xcss={gridStyles}>
            <Flex xcss={closeContainerStyles} justifyContent="end" alignItems="center">
              <IconButton
                appearance="subtle"
                icon={CrossIcon}
                label="Close Modal"
                onClick={closeFlashcardEditModal}
              />
            </Flex>
            <Flex xcss={titleContainerStyles} justifyContent="start" alignItems="center">
              <ModalTitle>Edit Flashcard</ModalTitle>
            </Flex>
          </Grid>
        </ModalHeader>
        {/************************************* ERROR MESSAGE ***************************************/}
        <ModalBody>
          {errorMessage &&
            <Collapse in={closeError}>
              <Alert
                severity="error"
                onClose={() => setCloseError(false)}
              >
                {errorMessage}
              </Alert>
            </Collapse>
          }

          {/************************************* FLASHCARD FRONT FIELD ***************************************/}
          <Field id="flashcard-front" name="flashcard-front" label="Flashcard Front">
            {({ fieldProps }) => (
              <Textfield {...fieldProps} value={front} onChange={(e) => setFront(e.target.value)} placeholder="Type the front of the flashcard here..." />
            )}
          </Field>

          {/************************************* FLASHCARD BACK FIELD ***************************************/}
          <Field id="flashcard-back" name="flashcard-back" label="Flashcard Back">
            {({ fieldProps }) => (
              <Textfield {...fieldProps} value={back} onChange={(e) => setBack(e.target.value)} placeholder="Type the back of the flashcard here..." />
            )}
          </Field>

          {/************************************* HINT FIELD ***************************************/}
          <Field id="flashcard-hint" name="flashcard-hint" label="Flashcard Hint">
            {({ fieldProps }) => (
              <Textfield {...fieldProps} value={hint} onChange={(e) => setHint(e.target.value)} placeholder="Type a hint for the flashcard here..." />
            )}
          </Field>

          {/************************************* LOCK/UNLOCKED FIELD ***************************************/}
          <Field>
            {() => (
              <span onClick={() => setLocked(!locked)} style={{ cursor: 'pointer', justifyContent: 'flex-end', display: 'flex', alignItems: 'center' }}>
                {locked ? 'This flashcard will be locked, only the owner can edit and delete' : 'This flashcard will be unlocked, others can edit and delete'}
                <span>
                  {locked ? (
                    <LockIcon label="Locked" />
                  ) : (
                    <UnlockIcon label="Unlocked" />
                  )}
                </span>
              </span>
            )}
          </Field>

          {/************************************* SUCCESS MESSAGE ***************************************/}
          {saveSuccess && <Alert severity="success"> Flashcard edited successfully! </Alert>}

        </ModalBody>

        {/************************************* ACTION BUTTONS ***************************************/}
        <ModalFooter>
          <Button appearance="subtle" onClick={handleClose}>Cancel</Button>
          <Button appearance="primary" onClick={handleSaveGlobal}>Save</Button>
        </ModalFooter>
      </Modal>
    </ModalTransition>
  );
}

export default EditFlashcardGlobal;