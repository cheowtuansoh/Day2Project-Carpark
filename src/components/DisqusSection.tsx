import React from 'react';
import { DisqusComments } from './DisqusComments';

export const DisqusSection: React.FC = () => {
  return (
    <div id="community-discussions" className="mt-14 pt-8 border-t border-[#efe7d9]/60">
      <DisqusComments
        currentLocation={{
          id: 'day2-project-carpark-main',
          name: 'ParkFinder SG - Real-Time Singapore Carpark Portal'
        }}
      />
    </div>
  );
};
