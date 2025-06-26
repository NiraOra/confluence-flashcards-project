import React from 'react';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/splide/dist/css/splide.min.css';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import './CardSlider.css';

const CardSlider = ({ cards = [], tagMap = [], onDelete, onEdit }) => {

  return (
    <div className='container'>
      {/************************************* PAGE DISPLAY ***************************************/}
      <div className='card-wrapper'>
        <ul className='card-list'>
          <Splide
            options={{
              type: 'slide',
              perPage: 5,
              pagination: false,
              gap: '10px',
              breakpoints: {
                800: {
                  perPage: 2,
                },

                1000: {
                  perPage: 3,
                },
                1200: {
                  perPage: 4,
                },
              },
            }}
          >
            {/************************************* EACH CARD ITEM IN SPLIDE ***************************************/}
            {cards.map((card) => (
              <SplideSlide key={card.id} className='card-item'>
              <div className="card-link">

                {/************************************* CARD TAGS ***************************************/}
                <div className='card-tags'>
                  {tagMap[card.id]?.map((tag) => (
                    <span
                      key={tag.id}
                      className={`badge ${tag.colour}`}
                    >
                      {tag.title || "Tag"}
                    </span>
                    ))}
                </div>

                {/************************************* CARD FRONT & BACK AND OWNER ***************************************/}
                {card.front && <h4 className='card-front'>{card.front}</h4>}
                {card.back && <h4 className='card-back'>{card.back}</h4>}
                <h4 className='card-owner'>By {card.name || 'Unknown'}</h4>

                {/************************************* ACTION BUTTONS ***************************************/}
                <div className='card-button'>
                  <EditIcon className='card-edit-button'  onClick={() => onEdit(card)}/>
                  <DeleteIcon className='card-delete-button' onClick={() => onDelete(card)} />

                </div>
              </div>
              </SplideSlide>
            ))}
          </Splide>
        </ul>
      </div>
    </div>
  );
};

export default CardSlider;
