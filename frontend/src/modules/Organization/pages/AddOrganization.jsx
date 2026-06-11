import React from 'react';
import OrganizationForm from '../../../components/Organizations/OrganizationForm';
// Assuming a shared Modal component exists in utils or components/Modal.jsx
// For this example, we assume you extract the Modal utility component from the previous step.

// NOTE: You must extract the Modal utility component from the previous response
// (e.g., to a path like ../../components/Modal.jsx) for this import to work.
const Modal = ({ isOpen, onClose, title, children, maxWidth }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity p-4" onClick={onClose}>
            <div
                className={`bg-white rounded-lg shadow-2xl w-full ${maxWidth || 'max-w-xl'} max-h-[90vh] overflow-y-auto`}
                onClick={e => e.stopPropagation()}
            >
                <div className="p-5 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="p-1 rounded-full">X</button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
};


const AddOrganization = ({ isOpen, onClose, onSave }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Organization"
      maxWidth="max-w-2xl"
    >
      <OrganizationForm
        // When adding, orgToEdit is null
        orgToEdit={null}
        onClose={onClose}
        onSave={onSave}
      />
    </Modal>
  );
};

export default AddOrganization;