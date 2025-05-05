import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacialRecognitionComponent } from './facial-recognition.component';

describe('FacialRecognitionComponent', () => {
  let component: FacialRecognitionComponent;
  let fixture: ComponentFixture<FacialRecognitionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacialRecognitionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacialRecognitionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
