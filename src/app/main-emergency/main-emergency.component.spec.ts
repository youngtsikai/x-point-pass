import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainEmergencyComponent } from './main-emergency.component';

describe('MainEmergencyComponent', () => {
  let component: MainEmergencyComponent;
  let fixture: ComponentFixture<MainEmergencyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainEmergencyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainEmergencyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
