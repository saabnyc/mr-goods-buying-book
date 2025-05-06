import { useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import SignaturePad from 'react-signature-canvas';

const supabase = createClient(
  'https://epychgzjduuqwimpmfpe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVweWNoZ3pqZHV1cXdpbXBtZnBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzOTA2MTksImV4cCI6MjA2MTk2NjYxOX0.sBOxv-xnLltQqWs2ZUSA_D4K73auZBRPlJch-asD7U8'
);

export default function App() {
  const sigPad = useRef(null);
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    itemDescription: '',
    serialNumber: '',
    price: '',
    date: new Date().toISOString().slice(0, 10),
    photo: null,
    idPhoto: null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const signatureDataUrl = sigPad.current.getTrimmedCanvas().toDataURL('image/png');
    const signatureBlob = await (await fetch(signatureDataUrl)).blob();
    const signaturePath = `signatures/${Date.now()}_signature.png`;

    const { error: sigError } = await supabase.storage.from('documents').upload(signaturePath, signatureBlob);
    const photoPath = `items/${Date.now()}_${form.photo.name}`;
    const idPhotoPath = `ids/${Date.now()}_${form.idPhoto.name}`;

    const { error: photoError } = await supabase.storage.from('documents').upload(photoPath, form.photo);
    const { error: idPhotoError } = await supabase.storage.from('documents').upload(idPhotoPath, form.idPhoto);

    if (photoError || idPhotoError || sigError) {
      alert('Error uploading files');
      return;
    }

    const { error } = await supabase.from('receipts').insert([
      {
        name: form.name,
        address: form.address,
        phone: form.phone,
        item_description: form.itemDescription,
        serial_number: form.serialNumber,
        price: form.price,
        date: form.date,
        photo_path: photoPath,
        id_photo_path: idPhotoPath,
        signature_path: signaturePath,
      },
    ]);

    if (error) {
      alert('Error saving record');
    } else {
      alert('Record saved!');
      sigPad.current.clear();
      setForm({
        name: '',
        address: '',
        phone: '',
        itemDescription: '',
        serialNumber: '',
        price: '',
        date: new Date().toISOString().slice(0, 10),
        photo: null,
        idPhoto: null,
      });
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-2">Mr. Goods Buying Book</h1>
      <p className="mb-4 text-sm">
        Store Info: Mr. Goods NYC LLC • 37 W 47th St, New York, NY 10036 • Phone: (646) 346-4930 • DCA License: #2104215-DCA
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="name" placeholder="Customer Name" value={form.name} onChange={handleChange} className="w-full p-2 border rounded" required />
        <input name="address" placeholder="Address" value={form.address} onChange={handleChange} className="w-full p-2 border rounded" required />
        <input name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} className="w-full p-2 border rounded" required />
        <input name="itemDescription" placeholder="Item Description" value={form.itemDescription} onChange={handleChange} className="w-full p-2 border rounded" required />
        <input name="serialNumber" placeholder="Serial Number / Markings" value={form.serialNumber} onChange={handleChange} className="w-full p-2 border rounded" required />
        <input name="price" placeholder="Purchase Price ($)" value={form.price} onChange={handleChange} className="w-full p-2 border rounded" required />
        <input name="date" type="date" value={form.date} onChange={handleChange} className="w-full p-2 border rounded" required />

        <div>
          <label className="block mb-1">Item Photo</label>
          <input name="photo" type="file" onChange={handleChange} className="w-full" required />
        </div>

        <div>
          <label className="block mb-1">Customer ID Photo</label>
          <input name="idPhoto" type="file" onChange={handleChange} className="w-full" required />
        </div>

        <div>
          <label className="block mb-1">Customer Signature</label>
          <SignaturePad ref={sigPad} canvasProps={{ className: 'w-full h-32 border' }} />
          <button type="button" onClick={() => sigPad.current.clear()} className="mt-2 text-sm text-blue-600">Clear Signature</button>
        </div>

        <button type="submit" className="bg-black text-white p-2 rounded w-full">Submit Record</button>
      </form>
    </div>
  );
}